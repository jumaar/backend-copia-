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
}

@WebSocketGateway({
  namespace: '/api/frigorifico/estacion',
  cors: {
    origin: '*',
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
    try {
      // Intentar leer token de handshake.auth primero (compatibilidad)
      let token = client.handshake.auth?.token;

      // Si no está en handshake, leer de cookies HttpOnly
      if (!token && client.handshake.headers?.cookie) {
        const cookies = client.handshake.headers.cookie.split(';');
        const estacionCookie = cookies.find(c =>
          c.trim().startsWith('estacionToken=')
        );
        if (estacionCookie) {
          token = estacionCookie.split('=')[1];
        }
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      if (payload.type !== 'estacion') {
        client.disconnect();
        return;
      }

      client.data.user = payload;
      this.logger.log(`Estación ${payload.sub} conectada`);
    } catch (error) {
      this.logger.error('Error de autenticación WS:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const estacionId = client.data.user?.sub;
    if (estacionId) {
      this.logger.log(`Estación ${estacionId} desconectada`);
    }
  }

  @SubscribeMessage('join-estacion')
  async handleJoinEstacion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { estacionId: string }
  ) {
    const user = client.data.user;
    if (!user || user.sub !== data.estacionId) {
      client.emit('error', { message: 'No autorizado para esta estación' });
      return;
    }

    client.join(`estacion-${data.estacionId}`);
    client.emit('joined', {
      status: 'connected',
      estacionId: data.estacionId,
      frigorificoId: user.frigorificoId
    });

    this.logger.log(`Estación ${data.estacionId} unida a room`);
  }

  @SubscribeMessage('crear-empaques')
  async handleCrearEmpaques(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { empaques: EmpaqueData[] }
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    try {
      const resultados = await this.frigorificoService.crearEmpaquesBatch(
        data.empaques,
        user.sub, // estacionId
        user.frigorificoId
      );

      client.emit('empaques-creados', {
        creados: resultados.creados.length,
        errores: resultados.errores,
        empaques: resultados.creados
      });

      // Notificar a otros clientes conectados a la misma estación
      client.to(`estacion-${user.sub}`).emit('batch-completed', {
        total: resultados.creados.length,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error creando empaques:', error);
      client.emit('error', {
        tipo: 'batch-failed',
        mensaje: error.message
      });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('get-catalogo')
  async handleGetCatalogo(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user) return;

    try {
      const catalogo = await this.frigorificoService.getCatalogoProductos(user.frigorificoId);
      client.emit('catalogo', catalogo);
    } catch (error) {
      client.emit('error', { tipo: 'catalogo-error', mensaje: error.message });
    }
  }
}