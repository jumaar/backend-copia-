import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CrearDepartamentoDto } from './dto/crear-departamento.dto';
import { AgregarCiudadesDto } from './dto/agregar-ciudades.dto';
import { AsignarCiudadDto } from './dto/asignar-ciudad.dto';

@Injectable()
export class SuperadminService {
  constructor(private readonly db: DatabaseService) {}

  async getDepartamentosCiudades() {
    const departamentos = await this.db.dEPARTAMENTO.findMany({
      include: {
        ciudades: {
          orderBy: { nombre_ciudad: 'asc' },
        },
      },
      orderBy: { nombre_departamento: 'asc' },
    });

    const adminIds = [
      ...new Set(
        departamentos
          .flatMap((d) => d.ciudades.map((c) => c.id_admin))
          .filter(Boolean),
      ),
    ] as number[];

    const admins =
      adminIds.length > 0
        ? await this.db.uSUARIOS.findMany({
            where: { id_usuario: { in: adminIds } },
            select: {
              id_usuario: true,
              nombre_usuario: true,
              apellido_usuario: true,
            },
          })
        : [];

    const adminMap = new Map(
      admins.map((a) => [
        a.id_usuario,
        `${a.nombre_usuario} ${a.apellido_usuario}`,
      ]),
    );

    return departamentos.map((d) => ({
      ...d,
      ciudades: d.ciudades.map((c) => ({
        ...c,
        admin_nombre: c.id_admin ? adminMap.get(c.id_admin) || 'Desconocido' : null,
      })),
    }));
  }

  async getAdmins() {
    return this.db.uSUARIOS.findMany({
      where: { id_rol: 2, activo: true },
      select: {
        id_usuario: true,
        nombre_usuario: true,
        apellido_usuario: true,
        email: true,
      },
      orderBy: { nombre_usuario: 'asc' },
    });
  }

  async crearDepartamento(dto: CrearDepartamentoDto) {
    if (!dto.ciudades || dto.ciudades.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos una ciudad');
    }

    const departamento = await this.db.dEPARTAMENTO.create({
      data: {
        nombre_departamento: dto.nombre_departamento,
        ciudades: {
          create: dto.ciudades.map((nombre) => ({
            nombre_ciudad: nombre.trim(),
          })),
        },
      },
      include: { ciudades: true },
    });

    return departamento;
  }

  async agregarCiudades(dto: AgregarCiudadesDto) {
    const departamento = await this.db.dEPARTAMENTO.findUnique({
      where: { id__departamento: dto.id__departamento },
    });

    if (!departamento) {
      throw new NotFoundException('Departamento no encontrado');
    }

    if (!dto.ciudades || dto.ciudades.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos una ciudad');
    }

    await this.db.cIUDAD.createMany({
      data: dto.ciudades.map((nombre) => ({
        nombre_ciudad: nombre.trim(),
        id__departamento: dto.id__departamento,
      })),
    });

    return this.db.dEPARTAMENTO.findUnique({
      where: { id__departamento: dto.id__departamento },
      include: {
        ciudades: {
          orderBy: { nombre_ciudad: 'asc' },
        },
      },
    });
  }

  async asignarCiudad(dto: AsignarCiudadDto) {
    const ciudad = await this.db.cIUDAD.findUnique({
      where: { id_ciudad: dto.id_ciudad },
    });

    if (!ciudad) {
      throw new NotFoundException('Ciudad no encontrada');
    }

    if (dto.id_admin) {
      const admin = await this.db.uSUARIOS.findUnique({
        where: { id_usuario: dto.id_admin, id_rol: 2 },
      });

      if (!admin) {
        throw new BadRequestException('El usuario no es un Admin válido');
      }
    }

    return this.db.cIUDAD.update({
      where: { id_ciudad: dto.id_ciudad },
      data: { id_admin: dto.id_admin },
    });
  }

  async eliminarCiudad(id_ciudad: number) {
    const ciudad = await this.db.cIUDAD.findUnique({
      where: { id_ciudad },
      include: {
        frigorificos: { select: { id_frigorifico: true } },
        tiendas: { select: { id_tienda: true } },
      },
    });

    if (!ciudad) {
      throw new NotFoundException('Ciudad no encontrada');
    }

    if (ciudad.frigorificos.length > 0 || ciudad.tiendas.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar la ciudad porque tiene frigoríficos o tiendas asociados',
      );
    }

    return this.db.cIUDAD.delete({ where: { id_ciudad } });
  }

  async eliminarDepartamento(id__departamento: number) {
    const departamento = await this.db.dEPARTAMENTO.findUnique({
      where: { id__departamento },
      include: { ciudades: { select: { id_ciudad: true } } },
    });

    if (!departamento) {
      throw new NotFoundException('Departamento no encontrado');
    }

    if (departamento.ciudades.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar el departamento porque tiene ciudades asociadas',
      );
    }

    return this.db.dEPARTAMENTO.delete({
      where: { id__departamento },
    });
  }
}
