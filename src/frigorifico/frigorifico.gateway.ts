import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { FrigorificoService } from './frigorifico.service';
import { JwtService } from '@nestjs/jwt';

interface EmpaqueData {
  productoId: number;
  peso: number;
  precioCalculado: number;
  epc: string;
}

@WebSocketGateway({
  namespace: '/api/frigorifico/estacion',
  cors: {
    origin: 'https://localhost:5000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class FrigorificoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(FrigorificoGateway.name);

  constructor(
    private readonly frigorificoService: FrigorificoService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const clientIp = client.handshake.address;
    this.logger.log(`🔌 WS: Nueva conexión desde ${clientIp}`);

    try {
      // Intentar leer token de handshake.auth primero (compatibilidad)
      let token = client.handshake.auth?.token;
      let tokenSource = 'handshake';

      // Si no está en handshake, leer de cookies HttpOnly
      if (!token && client.handshake.headers?.cookie) {
        const cookies = client.handshake.headers.cookie.split(';');
        const estacionCookie = cookies.find(c =>
          c.trim().startsWith('estacionToken=')
        );
        if (estacionCookie) {
          token = estacionCookie.split('=')[1];
          tokenSource = 'cookie';
        }
      }

      if (!token) {
        this.logger.warn(`❌ WS: Conexión rechazada - Sin token (${clientIp})`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      if (payload.type !== 'estacion') {
        this.logger.warn(`❌ WS: Conexión rechazada - Token inválido tipo: ${payload.type} (${clientIp})`);
        client.disconnect();
        return;
      }

      client.data.user = payload;
      this.logger.log(`✅ WS: Estación ${payload.sub} conectada desde ${clientIp} (token: ${tokenSource})`);
    } catch (error) {
      this.logger.error(`❌ WS: Error de autenticación desde ${clientIp}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const estacionId = client.data.user?.sub;
    const clientIp = client.handshake.address;
    if (estacionId) {
      this.logger.log(`🔌 WS: Estación ${estacionId} desconectada (${clientIp})`);
    } else {
      this.logger.log(`🔌 WS: Cliente sin autenticar desconectado (${clientIp})`);
    }
  }

  @SubscribeMessage('join-estacion')
  async handleJoinEstacion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { estacionId: string }
  ) {
    const user = client.data.user;
    const clientIp = client.handshake.address;

    if (!user || user.sub !== data.estacionId) {
      this.logger.warn(`🚫 WS: Join rechazado - Usuario ${user?.sub} intentó unirse a ${data.estacionId} (${clientIp})`);
      client.emit('error', { message: 'No autorizado para esta estación' });
      return;
    }

    client.join(`estacion-${data.estacionId}`);
    client.emit('joined', {
      status: 'connected',
      estacionId: data.estacionId,
      frigorificoId: user.frigorificoId
    });

    this.logger.log(`📡 WS: Estación ${data.estacionId} unida a room (Frigorífico: ${user.frigorificoId}) (${clientIp})`);
  }

  @SubscribeMessage('crear-empaques')
  async handleCrearEmpaques(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { empaques: EmpaqueData[] }
  ) {
    const user = client.data.user;
    const clientIp = client.handshake.address;

    if (!user) {
      this.logger.warn(`🚫 WS: Crear empaques rechazado - Usuario no autenticado (${clientIp})`);
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    const numEmpaques = data.empaques?.length || 0;
    this.logger.log(`📦 WS: Creando ${numEmpaques} empaques - Estación ${user.sub} (${clientIp})`);

    try {
      const resultados = await this.frigorificoService.crearEmpaquesBatch(
        data.empaques,
        user.sub, // estacionId
        user.frigorificoId
      );

      const creados = resultados.creados.length;
      const errores = resultados.errores.length;

      this.logger.log(`✅ WS: Empaques creados: ${creados}, Errores: ${errores} - Estación ${user.sub}`);

      client.emit('empaques-creados', {
        creados: creados,
        errores: resultados.errores,
        empaques: resultados.creados
      });

      // Notificar a otros clientes conectados a la misma estación
      client.to(`estacion-${user.sub}`).emit('batch-completed', {
        total: creados,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error(`❌ WS: Error creando empaques - Estación ${user.sub}:`, error.message);
      client.emit('error', {
        tipo: 'batch-failed',
        mensaje: error.message
      });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    const clientIp = client.handshake.address;

    if (user) {
      this.logger.debug(`🏓 WS: Ping recibido de Estación ${user.sub} (${clientIp})`);
    } else {
      this.logger.debug(`🏓 WS: Ping recibido de cliente no autenticado (${clientIp})`);
    }

    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('get-catalogo')
  async handleGetCatalogo(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    const clientIp = client.handshake.address;

    if (!user) {
      this.logger.warn(`🚫 WS: Get catálogo rechazado - Usuario no autenticado (${clientIp})`);
      return;
    }

    this.logger.log(`📋 WS: Solicitud de catálogo - Estación ${user.sub} (${clientIp})`);

    try {
      // Obtener productos con campos mínimos para la báscula
      const productos = await this.frigorificoService.findAllProductos(user.sub);

      // Solo id, nombre y peso para la báscula
      const catalogoDepurado = productos.map(producto => ({
        id: producto.id_producto,
        nombre: producto.nombre_producto,
        peso: producto.peso_nominal_g,
      }));

      this.logger.log(`✅ WS: Catálogo enviado (${catalogoDepurado.length} productos) - Estación ${user.sub}`);
      client.emit('catalogo', catalogoDepurado);
    } catch (error) {
      this.logger.error(`❌ WS: Error obteniendo catálogo - Estación ${user.sub}:`, error.message);
      client.emit('error', { tipo: 'catalogo-error', mensaje: error.message });
    }
  }
}