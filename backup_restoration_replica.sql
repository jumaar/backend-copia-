--
-- PostgreSQL database dump
--

\restrict rSgNpW9cNgPuRM3axdZVK7ZBGdBC7iGJw6SyiAKwjljOh4kmAX65Qhsg1lc1RwQ

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: TipoMedia; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."TipoMedia" AS ENUM (
    'IMAGEN',
    'VIDEO'
);


ALTER TYPE public."TipoMedia" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BIBLIOTECA; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."BIBLIOTECA" (
    id integer NOT NULL,
    nombre text NOT NULL,
    tipo public."TipoMedia" NOT NULL,
    url text NOT NULL
);


ALTER TABLE public."BIBLIOTECA" OWNER TO admin;

--
-- Name: BIBLIOTECA_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."BIBLIOTECA_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BIBLIOTECA_id_seq" OWNER TO admin;

--
-- Name: BIBLIOTECA_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."BIBLIOTECA_id_seq" OWNED BY public."BIBLIOTECA".id;


--
-- Name: CIUDAD; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."CIUDAD" (
    id_ciudad integer NOT NULL,
    nombre_ciudad text,
    id__departamento integer NOT NULL
);


ALTER TABLE public."CIUDAD" OWNER TO admin;

--
-- Name: CIUDAD_id_ciudad_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."CIUDAD_id_ciudad_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CIUDAD_id_ciudad_seq" OWNER TO admin;

--
-- Name: CIUDAD_id_ciudad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."CIUDAD_id_ciudad_seq" OWNED BY public."CIUDAD".id_ciudad;


--
-- Name: DEPARTAMENTO; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."DEPARTAMENTO" (
    id__departamento integer NOT NULL,
    nombre_departamento text
);


ALTER TABLE public."DEPARTAMENTO" OWNER TO admin;

--
-- Name: DEPARTAMENTO_id__departamento_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."DEPARTAMENTO_id__departamento_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DEPARTAMENTO_id__departamento_seq" OWNER TO admin;

--
-- Name: DEPARTAMENTO_id__departamento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."DEPARTAMENTO_id__departamento_seq" OWNED BY public."DEPARTAMENTO".id__departamento;


--
-- Name: EMPAQUES; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."EMPAQUES" (
    id_empaque integer NOT NULL,
    "EPC_id" text NOT NULL,
    fecha_empaque_1 timestamp(3) without time zone NOT NULL,
    id_producto integer NOT NULL,
    peso_exacto_g numeric(65,30) NOT NULL,
    precio_venta_total numeric(65,30) NOT NULL,
    fecha_vencimiento date NOT NULL,
    costo_frigorifico numeric(65,30) NOT NULL,
    id_logistica integer,
    hora_en_logistica_2 timestamp(3) without time zone,
    id_nevera integer,
    hora_en_nevera_3 timestamp(3) without time zone,
    hora_pendiente_pago_4 timestamp(3) without time zone,
    hora_para_cambio_5 timestamp(3) without time zone,
    fridge_id_final integer,
    hora_surtido_final_6 timestamp(3) without time zone,
    fecha_finalizacion_7_8 timestamp(3) without time zone,
    id_estado_empaque integer NOT NULL,
    promocion_id integer,
    id_estacion text NOT NULL
);


ALTER TABLE public."EMPAQUES" OWNER TO admin;

--
-- Name: EMPAQUES_id_empaque_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."EMPAQUES_id_empaque_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EMPAQUES_id_empaque_seq" OWNER TO admin;

--
-- Name: EMPAQUES_id_empaque_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."EMPAQUES_id_empaque_seq" OWNED BY public."EMPAQUES".id_empaque;


--
-- Name: ESTACIONES; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ESTACIONES" (
    id_estacion text NOT NULL,
    id_frigorifico integer NOT NULL,
    clave_vinculacion text NOT NULL,
    activa boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ESTACIONES" OWNER TO admin;

--
-- Name: ESTACIONES_id_estacion_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ESTACIONES_id_estacion_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ESTACIONES_id_estacion_seq" OWNER TO admin;

--
-- Name: ESTACIONES_id_estacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ESTACIONES_id_estacion_seq" OWNED BY public."ESTACIONES".id_estacion;


--
-- Name: ESTADO_EMPAQUE; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ESTADO_EMPAQUE" (
    id_estado_empaque integer NOT NULL,
    nombre_estado text
);


ALTER TABLE public."ESTADO_EMPAQUE" OWNER TO admin;

--
-- Name: ESTADO_EMPAQUE_id_estado_empaque_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ESTADO_EMPAQUE_id_estado_empaque_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ESTADO_EMPAQUE_id_estado_empaque_seq" OWNER TO admin;

--
-- Name: ESTADO_EMPAQUE_id_estado_empaque_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ESTADO_EMPAQUE_id_estado_empaque_seq" OWNED BY public."ESTADO_EMPAQUE".id_estado_empaque;


--
-- Name: ESTADO_NEVERA; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ESTADO_NEVERA" (
    id_estado_nevera integer NOT NULL,
    estado_nevera text NOT NULL
);


ALTER TABLE public."ESTADO_NEVERA" OWNER TO admin;

--
-- Name: ESTADO_NEVERA_id_estado_nevera_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ESTADO_NEVERA_id_estado_nevera_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ESTADO_NEVERA_id_estado_nevera_seq" OWNER TO admin;

--
-- Name: ESTADO_NEVERA_id_estado_nevera_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ESTADO_NEVERA_id_estado_nevera_seq" OWNED BY public."ESTADO_NEVERA".id_estado_nevera;


--
-- Name: ESTADO_TRANSACCION; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ESTADO_TRANSACCION" (
    id_estado_transaccion integer NOT NULL,
    nombre_estado text NOT NULL
);


ALTER TABLE public."ESTADO_TRANSACCION" OWNER TO admin;

--
-- Name: ESTADO_TRANSACCION_id_estado_transaccion_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ESTADO_TRANSACCION_id_estado_transaccion_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ESTADO_TRANSACCION_id_estado_transaccion_seq" OWNER TO admin;

--
-- Name: ESTADO_TRANSACCION_id_estado_transaccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ESTADO_TRANSACCION_id_estado_transaccion_seq" OWNED BY public."ESTADO_TRANSACCION".id_estado_transaccion;


--
-- Name: FRIGORIFICO; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."FRIGORIFICO" (
    id_frigorifico integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre_frigorifico text NOT NULL,
    direccion text NOT NULL,
    id_ciudad integer NOT NULL
);


ALTER TABLE public."FRIGORIFICO" OWNER TO admin;

--
-- Name: FRIGORIFICO_id_frigorifico_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."FRIGORIFICO_id_frigorifico_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FRIGORIFICO_id_frigorifico_seq" OWNER TO admin;

--
-- Name: FRIGORIFICO_id_frigorifico_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."FRIGORIFICO_id_frigorifico_seq" OWNED BY public."FRIGORIFICO".id_frigorifico;


--
-- Name: ITEMS_DE_REPRODUCCION; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ITEMS_DE_REPRODUCCION" (
    id integer NOT NULL,
    id_lista_reproduccion integer NOT NULL,
    id_biblioteca integer NOT NULL,
    tiempo_reproduccion_s integer NOT NULL,
    orden_reproduccion integer NOT NULL
);


ALTER TABLE public."ITEMS_DE_REPRODUCCION" OWNER TO admin;

--
-- Name: ITEMS_DE_REPRODUCCION_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ITEMS_DE_REPRODUCCION_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ITEMS_DE_REPRODUCCION_id_seq" OWNER TO admin;

--
-- Name: ITEMS_DE_REPRODUCCION_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ITEMS_DE_REPRODUCCION_id_seq" OWNED BY public."ITEMS_DE_REPRODUCCION".id;


--
-- Name: LISTA_DE_REPRODUCCION; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."LISTA_DE_REPRODUCCION" (
    id_lista_reproduccion integer NOT NULL,
    nombre text NOT NULL,
    lista_json jsonb
);


ALTER TABLE public."LISTA_DE_REPRODUCCION" OWNER TO admin;

--
-- Name: LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq" OWNER TO admin;

--
-- Name: LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq" OWNED BY public."LISTA_DE_REPRODUCCION".id_lista_reproduccion;


--
-- Name: LOGISTICA; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."LOGISTICA" (
    id_logistica integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre_empresa text NOT NULL,
    placa_vehiculo text NOT NULL
);


ALTER TABLE public."LOGISTICA" OWNER TO admin;

--
-- Name: LOGISTICA_id_logistica_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."LOGISTICA_id_logistica_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LOGISTICA_id_logistica_seq" OWNER TO admin;

--
-- Name: LOGISTICA_id_logistica_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."LOGISTICA_id_logistica_seq" OWNED BY public."LOGISTICA".id_logistica;


--
-- Name: NEVERAS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."NEVERAS" (
    id_nevera integer NOT NULL,
    "contraseña" text NOT NULL,
    id_estado_nevera integer NOT NULL,
    id_tienda integer NOT NULL,
    version_software numeric(65,30) NOT NULL,
    ultima_conexion timestamp(3) without time zone,
    id_lista_reproduccion integer
);


ALTER TABLE public."NEVERAS" OWNER TO admin;

--
-- Name: NEVERAS_id_nevera_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."NEVERAS_id_nevera_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."NEVERAS_id_nevera_seq" OWNER TO admin;

--
-- Name: NEVERAS_id_nevera_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."NEVERAS_id_nevera_seq" OWNED BY public."NEVERAS".id_nevera;


--
-- Name: PERMISOS_ROLES; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."PERMISOS_ROLES" (
    id_rol_creador integer NOT NULL,
    id_rol_creable integer NOT NULL
);


ALTER TABLE public."PERMISOS_ROLES" OWNER TO admin;

--
-- Name: PRODUCTOS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."PRODUCTOS" (
    id_producto integer NOT NULL,
    nombre_producto text NOT NULL,
    descripcion_producto text,
    peso_nominal_g integer NOT NULL,
    precio_venta numeric(65,30) NOT NULL,
    dias_vencimiento integer NOT NULL,
    precio_frigorifico numeric(65,30) NOT NULL,
    alta double precision,
    baja double precision,
    media double precision
);


ALTER TABLE public."PRODUCTOS" OWNER TO admin;

--
-- Name: PRODUCTOS_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."PRODUCTOS_id_producto_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PRODUCTOS_id_producto_seq" OWNER TO admin;

--
-- Name: PRODUCTOS_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."PRODUCTOS_id_producto_seq" OWNED BY public."PRODUCTOS".id_producto;


--
-- Name: PROMOCIONES; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."PROMOCIONES" (
    id_promocion integer NOT NULL,
    nombre text,
    tipo text,
    valor numeric(65,30) NOT NULL
);


ALTER TABLE public."PROMOCIONES" OWNER TO admin;

--
-- Name: PROMOCIONES_id_promocion_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."PROMOCIONES_id_promocion_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PROMOCIONES_id_promocion_seq" OWNER TO admin;

--
-- Name: PROMOCIONES_id_promocion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."PROMOCIONES_id_promocion_seq" OWNED BY public."PROMOCIONES".id_promocion;


--
-- Name: REFRESH_TOKENS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."REFRESH_TOKENS" (
    id_refresh_token integer NOT NULL,
    id_usuario integer NOT NULL,
    token text NOT NULL,
    expira_en timestamp(3) without time zone NOT NULL,
    fecha_creacion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."REFRESH_TOKENS" OWNER TO admin;

--
-- Name: REFRESH_TOKENS_id_refresh_token_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."REFRESH_TOKENS_id_refresh_token_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."REFRESH_TOKENS_id_refresh_token_seq" OWNER TO admin;

--
-- Name: REFRESH_TOKENS_id_refresh_token_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."REFRESH_TOKENS_id_refresh_token_seq" OWNED BY public."REFRESH_TOKENS".id_refresh_token;


--
-- Name: REPORTE_ESTADO_NEVERAS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."REPORTE_ESTADO_NEVERAS" (
    id_reporte_estado integer NOT NULL,
    id_nevera integer NOT NULL,
    hora_reporte timestamp(3) without time zone NOT NULL,
    evento text,
    temperatura_c double precision NOT NULL,
    id_temperatura_nevera integer NOT NULL
);


ALTER TABLE public."REPORTE_ESTADO_NEVERAS" OWNER TO admin;

--
-- Name: REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq" OWNER TO admin;

--
-- Name: REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq" OWNED BY public."REPORTE_ESTADO_NEVERAS".id_reporte_estado;


--
-- Name: ROLES; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ROLES" (
    id_rol integer NOT NULL,
    nombre_rol text
);


ALTER TABLE public."ROLES" OWNER TO admin;

--
-- Name: ROLES_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."ROLES_id_rol_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ROLES_id_rol_seq" OWNER TO admin;

--
-- Name: ROLES_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."ROLES_id_rol_seq" OWNED BY public."ROLES".id_rol;


--
-- Name: STOCK_NEVERA; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."STOCK_NEVERA" (
    id integer NOT NULL,
    id_nevera integer NOT NULL,
    id_producto integer NOT NULL,
    stock_minimo integer DEFAULT 2 NOT NULL,
    stock_maximo integer DEFAULT 5 NOT NULL,
    venta_semanal integer DEFAULT 0 NOT NULL,
    stock_ideal_final integer NOT NULL,
    calificacion_surtido text NOT NULL,
    mensaje_sistema text,
    stock_en_tiempo_real integer NOT NULL,
    hora_calificacion timestamp(3) without time zone,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public."STOCK_NEVERA" OWNER TO admin;

--
-- Name: STOCK_NEVERA_PRODUCTO_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."STOCK_NEVERA_PRODUCTO_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."STOCK_NEVERA_PRODUCTO_id_seq" OWNER TO admin;

--
-- Name: STOCK_NEVERA_PRODUCTO_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."STOCK_NEVERA_PRODUCTO_id_seq" OWNED BY public."STOCK_NEVERA".id;


--
-- Name: TEMPERATURA_NEVERA; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TEMPERATURA_NEVERA" (
    id_temperatura_nevera integer NOT NULL,
    nombre_estado text
);


ALTER TABLE public."TEMPERATURA_NEVERA" OWNER TO admin;

--
-- Name: TEMPERATURA_NEVERA_id_temperatura_nevera_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."TEMPERATURA_NEVERA_id_temperatura_nevera_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TEMPERATURA_NEVERA_id_temperatura_nevera_seq" OWNER TO admin;

--
-- Name: TEMPERATURA_NEVERA_id_temperatura_nevera_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."TEMPERATURA_NEVERA_id_temperatura_nevera_seq" OWNED BY public."TEMPERATURA_NEVERA".id_temperatura_nevera;


--
-- Name: TIENDAS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TIENDAS" (
    id_tienda integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre_tienda text NOT NULL,
    direccion text NOT NULL,
    id_ciudad integer NOT NULL
);


ALTER TABLE public."TIENDAS" OWNER TO admin;

--
-- Name: TIENDAS_id_tienda_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."TIENDAS_id_tienda_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TIENDAS_id_tienda_seq" OWNER TO admin;

--
-- Name: TIENDAS_id_tienda_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."TIENDAS_id_tienda_seq" OWNED BY public."TIENDAS".id_tienda;


--
-- Name: TIPO_TRANSACCION; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TIPO_TRANSACCION" (
    id_tipo integer NOT NULL,
    nombre_codigo text NOT NULL,
    descripcion_amigable text
);


ALTER TABLE public."TIPO_TRANSACCION" OWNER TO admin;

--
-- Name: TIPO_TRANSACCION_id_tipo_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."TIPO_TRANSACCION_id_tipo_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TIPO_TRANSACCION_id_tipo_seq" OWNER TO admin;

--
-- Name: TIPO_TRANSACCION_id_tipo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."TIPO_TRANSACCION_id_tipo_seq" OWNED BY public."TIPO_TRANSACCION".id_tipo;


--
-- Name: TOKEN_REGISTRO; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TOKEN_REGISTRO" (
    id integer NOT NULL,
    token text NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en timestamp(3) without time zone NOT NULL,
    es_usado boolean DEFAULT false NOT NULL,
    id_usuario_creador integer NOT NULL,
    id_rol_nuevo_usuario integer NOT NULL,
    id_usuario_nuevo integer
);


ALTER TABLE public."TOKEN_REGISTRO" OWNER TO admin;

--
-- Name: TOKEN_REGISTRO_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."TOKEN_REGISTRO_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TOKEN_REGISTRO_id_seq" OWNER TO admin;

--
-- Name: TOKEN_REGISTRO_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."TOKEN_REGISTRO_id_seq" OWNED BY public."TOKEN_REGISTRO".id;


--
-- Name: TRANSACCIONES; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TRANSACCIONES" (
    id_transaccion integer NOT NULL,
    id_empaque integer,
    id_usuario integer NOT NULL,
    id_transaccion_rel integer,
    monto numeric(65,30) NOT NULL,
    hora_transaccion timestamp(3) without time zone NOT NULL,
    id_tipo_transaccion integer NOT NULL,
    nota_opcional text,
    estado_transaccion integer NOT NULL
);


ALTER TABLE public."TRANSACCIONES" OWNER TO admin;

--
-- Name: TRANSACCIONES_id_transaccion_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."TRANSACCIONES_id_transaccion_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TRANSACCIONES_id_transaccion_seq" OWNER TO admin;

--
-- Name: TRANSACCIONES_id_transaccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."TRANSACCIONES_id_transaccion_seq" OWNED BY public."TRANSACCIONES".id_transaccion;


--
-- Name: USUARIOS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."USUARIOS" (
    id_usuario integer NOT NULL,
    nombre_usuario text,
    apellido_usuario text,
    identificacion_usuario text,
    celular numeric(65,30),
    email text NOT NULL,
    "contraseña" text NOT NULL,
    activo boolean NOT NULL,
    fecha_creacion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_ultima_modifi timestamp(3) without time zone NOT NULL,
    id_rol integer NOT NULL
);


ALTER TABLE public."USUARIOS" OWNER TO admin;

--
-- Name: USUARIOS_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."USUARIOS_id_usuario_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."USUARIOS_id_usuario_seq" OWNER TO admin;

--
-- Name: USUARIOS_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."USUARIOS_id_usuario_seq" OWNED BY public."USUARIOS".id_usuario;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Name: BIBLIOTECA id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."BIBLIOTECA" ALTER COLUMN id SET DEFAULT nextval('public."BIBLIOTECA_id_seq"'::regclass);


--
-- Name: CIUDAD id_ciudad; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."CIUDAD" ALTER COLUMN id_ciudad SET DEFAULT nextval('public."CIUDAD_id_ciudad_seq"'::regclass);


--
-- Name: DEPARTAMENTO id__departamento; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DEPARTAMENTO" ALTER COLUMN id__departamento SET DEFAULT nextval('public."DEPARTAMENTO_id__departamento_seq"'::regclass);


--
-- Name: EMPAQUES id_empaque; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES" ALTER COLUMN id_empaque SET DEFAULT nextval('public."EMPAQUES_id_empaque_seq"'::regclass);


--
-- Name: ESTADO_EMPAQUE id_estado_empaque; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTADO_EMPAQUE" ALTER COLUMN id_estado_empaque SET DEFAULT nextval('public."ESTADO_EMPAQUE_id_estado_empaque_seq"'::regclass);


--
-- Name: ESTADO_NEVERA id_estado_nevera; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTADO_NEVERA" ALTER COLUMN id_estado_nevera SET DEFAULT nextval('public."ESTADO_NEVERA_id_estado_nevera_seq"'::regclass);


--
-- Name: ESTADO_TRANSACCION id_estado_transaccion; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTADO_TRANSACCION" ALTER COLUMN id_estado_transaccion SET DEFAULT nextval('public."ESTADO_TRANSACCION_id_estado_transaccion_seq"'::regclass);


--
-- Name: FRIGORIFICO id_frigorifico; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."FRIGORIFICO" ALTER COLUMN id_frigorifico SET DEFAULT nextval('public."FRIGORIFICO_id_frigorifico_seq"'::regclass);


--
-- Name: ITEMS_DE_REPRODUCCION id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ITEMS_DE_REPRODUCCION" ALTER COLUMN id SET DEFAULT nextval('public."ITEMS_DE_REPRODUCCION_id_seq"'::regclass);


--
-- Name: LISTA_DE_REPRODUCCION id_lista_reproduccion; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."LISTA_DE_REPRODUCCION" ALTER COLUMN id_lista_reproduccion SET DEFAULT nextval('public."LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq"'::regclass);


--
-- Name: LOGISTICA id_logistica; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."LOGISTICA" ALTER COLUMN id_logistica SET DEFAULT nextval('public."LOGISTICA_id_logistica_seq"'::regclass);


--
-- Name: NEVERAS id_nevera; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."NEVERAS" ALTER COLUMN id_nevera SET DEFAULT nextval('public."NEVERAS_id_nevera_seq"'::regclass);


--
-- Name: PRODUCTOS id_producto; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PRODUCTOS" ALTER COLUMN id_producto SET DEFAULT nextval('public."PRODUCTOS_id_producto_seq"'::regclass);


--
-- Name: PROMOCIONES id_promocion; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PROMOCIONES" ALTER COLUMN id_promocion SET DEFAULT nextval('public."PROMOCIONES_id_promocion_seq"'::regclass);


--
-- Name: REFRESH_TOKENS id_refresh_token; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REFRESH_TOKENS" ALTER COLUMN id_refresh_token SET DEFAULT nextval('public."REFRESH_TOKENS_id_refresh_token_seq"'::regclass);


--
-- Name: REPORTE_ESTADO_NEVERAS id_reporte_estado; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REPORTE_ESTADO_NEVERAS" ALTER COLUMN id_reporte_estado SET DEFAULT nextval('public."REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq"'::regclass);


--
-- Name: ROLES id_rol; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ROLES" ALTER COLUMN id_rol SET DEFAULT nextval('public."ROLES_id_rol_seq"'::regclass);


--
-- Name: STOCK_NEVERA id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."STOCK_NEVERA" ALTER COLUMN id SET DEFAULT nextval('public."STOCK_NEVERA_PRODUCTO_id_seq"'::regclass);


--
-- Name: TEMPERATURA_NEVERA id_temperatura_nevera; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TEMPERATURA_NEVERA" ALTER COLUMN id_temperatura_nevera SET DEFAULT nextval('public."TEMPERATURA_NEVERA_id_temperatura_nevera_seq"'::regclass);


--
-- Name: TIENDAS id_tienda; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TIENDAS" ALTER COLUMN id_tienda SET DEFAULT nextval('public."TIENDAS_id_tienda_seq"'::regclass);


--
-- Name: TIPO_TRANSACCION id_tipo; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TIPO_TRANSACCION" ALTER COLUMN id_tipo SET DEFAULT nextval('public."TIPO_TRANSACCION_id_tipo_seq"'::regclass);


--
-- Name: TOKEN_REGISTRO id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TOKEN_REGISTRO" ALTER COLUMN id SET DEFAULT nextval('public."TOKEN_REGISTRO_id_seq"'::regclass);


--
-- Name: TRANSACCIONES id_transaccion; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES" ALTER COLUMN id_transaccion SET DEFAULT nextval('public."TRANSACCIONES_id_transaccion_seq"'::regclass);


--
-- Name: USUARIOS id_usuario; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."USUARIOS" ALTER COLUMN id_usuario SET DEFAULT nextval('public."USUARIOS_id_usuario_seq"'::regclass);


--
-- Data for Name: BIBLIOTECA; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."BIBLIOTECA" (id, nombre, tipo, url) FROM stdin;
1	CHORIZOS DE CERDO	IMAGEN	/images/chorizos-cerdo.jpg
2	PROMOCION DE CHORIZO	VIDEO	/videos/promocion-chorizo.mp4
3	PUBLICIDAD DIARIA	VIDEO	/videos/publicidad-diaria.mp4
\.


--
-- Data for Name: CIUDAD; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."CIUDAD" (id_ciudad, nombre_ciudad, id__departamento) FROM stdin;
1	Santa Rosa De Cabal	1
2	Dosquebradas	1
3	Pereira	1
4	Chinchina	4
\.


--
-- Data for Name: DEPARTAMENTO; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."DEPARTAMENTO" (id__departamento, nombre_departamento) FROM stdin;
1	Risaralda
2	Quindio
3	Valle Del Cauca
4	Caldas
\.


--
-- Data for Name: EMPAQUES; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."EMPAQUES" (id_empaque, "EPC_id", fecha_empaque_1, id_producto, peso_exacto_g, precio_venta_total, fecha_vencimiento, costo_frigorifico, id_logistica, hora_en_logistica_2, id_nevera, hora_en_nevera_3, hora_pendiente_pago_4, hora_para_cambio_5, fridge_id_final, hora_surtido_final_6, fecha_finalizacion_7_8, id_estado_empaque, promocion_id, id_estacion) FROM stdin;
14	cdertfgyuvbddhhh	2025-11-27 16:09:33.274	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
15	vfrtgyhjuikol	2025-11-27 16:09:40.034	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
16	cvbnhgfdsewrertrtyyu	2025-11-27 16:09:47.712	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
18	xcvbbnhgffdssaaqwe	2025-11-27 16:09:59.254	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
19	nbvccxxzasdfghhjjjiuytrr	2025-11-27 16:10:04.778	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
20	bvcxzzasdfghjkjkloou	2025-11-27 16:10:09.696	2	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-27	2261.000000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
21	mnbbghhjjuytredsdx	2025-11-27 16:10:14.581	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
22	bvccxxszsfdfgftftrrryiui	2025-11-27 16:10:19.571	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
23	nnvvcxzdsgkjkityrreem	2025-11-27 16:10:24.039	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
27	bvchjjugyftdtrsrdhfr	2025-11-27 16:11:11.132	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
28	bvvccxzasdffgh	2025-11-27 16:12:43.372	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
29	nbvvcxzzashgj	2025-11-27 16:12:54.434	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
30	bnvcxzasadfghjklk	2025-11-27 16:12:58.319	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
31	mbnvbvbcfdmhkujhl	2025-11-27 16:13:03.447	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
32	bvcddsfrtrjyhtrujgt,k	2025-11-27 16:13:38.929	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
33	vcxzsasdghklkj	2025-11-27 16:15:45.033	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
34	mnbvcxxzzasdghjhj	2025-11-27 16:15:51.481	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
35	mnbvbcxzzaasd	2025-11-27 16:15:57.93	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
36	,mnbbbvccncnhfcgfkjgfkj	2025-11-27 16:16:07.67	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
37	vcxzhjkjgfhgdgfdsgf	2025-11-27 16:16:49.132	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
42	kjjhjhgfddjydjydjuyf	2025-11-27 16:19:55.962	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
43	jhhgfgdfsfdafdsghjgjyutj	2025-11-27 16:20:03.885	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
44	jkjhghgfgfsfdagjhfkjghj	2025-11-27 16:20:09.744	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
45	b,kghfdhgfkl	2025-11-27 16:20:14.998	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
46	jgyhfdhgddjfkjjh	2025-11-27 16:20:20.271	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
47	kjgjhgdfdshjyfjjhyfj	2025-11-27 16:20:25.557	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
48	hjjhghdgffkghjfvhgdjfd	2025-11-27 16:20:31.051	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
49	jghfdgfdsgfjfvghgdhdjdjh	2025-11-27 16:20:37.582	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
50	jhhjhfgfdfsfh	2025-11-27 16:20:53.244	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
51	nbvccxssdgjftryutkiigrf	2025-11-27 16:23:48.68	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
52	nmbmjkmkhioyugthdfhfj	2025-11-27 16:23:53.92	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
53	jhjufhgdgfdshfdkugoiyoyh	2025-11-27 16:23:59.973	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
65	hfhghgndhjfdhjfnhfjhf	2025-11-27 16:27:09.726	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
66	nhcdhgfdfjyrfiurfytdergf	2025-11-27 16:27:16.773	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
67	hgdhjfkgjyufhdjkfjk	2025-11-27 16:27:22.346	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
68	hghfhgdhyhjdjdhjh	2025-11-27 16:28:10.295	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
69	ghfhgdhgjdhjfhgfdj	2025-11-27 16:28:20.447	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
70	jhjhghjfggxdhgfx	2025-11-27 16:28:29.252	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
71	jhhggffdsgfsnjfhjgjhyyg	2025-11-27 16:29:28.243	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
72	hhfghfddfdhyfkuhgkihjugy	2025-11-27 16:29:31.828	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
17	fgtresdfgghjuiuio	2025-11-27 16:09:53.81	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-11-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
117	ktmjfdhx7ryuejmyfk5u4ly8	2025-11-27 17:22:34.401	1	974.000000000000000000000000000000	9740.000000000000000000000000000000	2025-12-27	9253.000000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
118	foyi9rlyu9i4o9dyuy7oi	2025-11-27 17:22:40.715	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
119	234567890-1234567890-	2025-11-27 17:22:51.661	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
120	1234567890-1`234567op[]r	2025-11-27 17:22:59.391	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
121	123456789012345678909	2025-11-27 17:23:07.751	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
122	10000000000000000000000	2025-11-27 17:23:20.838	1	974.000000000000000000000000000000	9740.000000000000000000000000000000	2025-12-27	9253.000000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
123	1234567ruxjgth7feeeeeeee	2025-11-27 17:23:35.696	1	974.000000000000000000000000000000	9740.000000000000000000000000000000	2025-12-27	9253.000000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
124	rtyuijuytrghjhgjhghjmnhj	2025-11-27 17:23:40.708	1	974.000000000000000000000000000000	9740.000000000000000000000000000000	2025-12-27	9253.000000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
125	etytrtytr5u78r678uudghjh	2025-11-27 17:23:48.666	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
126	r4jytyjutrtyujhgtyj	2025-11-27 17:23:51.25	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
127	245yujuytrgthmjfbvgsdfgh	2025-11-27 17:23:55.49	1	975.000000000000000000000000000000	9750.000000000000000000000000000000	2025-12-27	9262.500000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
128	sghgfryjugtuiktuikh	2025-11-27 17:23:59.172	1	974.000000000000000000000000000000	9740.000000000000000000000000000000	2025-12-27	9253.000000000000000000000000000000	3	2025-11-27 20:29:57.552	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
110	YGDGCXGXGXGVoijgjuh	2025-11-27 17:17:02.861	4	516.000000000000000000000000000000	5160.000000000000000000000000000000	2025-12-22	5056.800000000000000000000000000000	3	2025-11-27 20:30:04.658	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
111	tyhyjuhjbnmmcxhfmfucbndj	2025-11-27 17:17:21.495	4	516.000000000000000000000000000000	5160.000000000000000000000000000000	2025-12-22	5056.800000000000000000000000000000	3	2025-11-27 20:30:04.658	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
112	jgfothj4jehe677trvcd	2025-11-27 17:17:42.314	4	516.000000000000000000000000000000	5160.000000000000000000000000000000	2025-12-22	5056.800000000000000000000000000000	3	2025-11-27 20:30:04.658	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
113	bjmrjfdhdetjyrffdfhtryfc	2025-11-27 17:19:02.387	6	976.000000000000000000000000000000	9760.000000000000000000000000000000	2026-01-06	9272.000000000000000000000000000000	3	2025-11-27 20:34:02.905	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
114	dsrpdedjfycyryfyu	2025-11-27 17:19:18.461	6	976.000000000000000000000000000000	9760.000000000000000000000000000000	2026-01-06	9272.000000000000000000000000000000	3	2025-11-27 20:34:02.905	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
115	123456789000111110ffmkvc	2025-11-27 17:19:37.625	6	976.000000000000000000000000000000	9760.000000000000000000000000000000	2026-01-06	9272.000000000000000000000000000000	3	2025-11-27 20:34:02.905	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
116	emanuelgfdtgffdggvd	2025-11-27 17:20:42.399	6	976.000000000000000000000000000000	9760.000000000000000000000000000000	2026-01-06	9272.000000000000000000000000000000	3	2025-11-27 20:34:02.905	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
2	fstfsfdsgfdsgftdgtfdihjg	2025-11-27 16:04:03.555	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
3	gfdhygdgftdgfdxfxfr	2025-11-27 16:04:06.635	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
4	dftdhfjulyiuytiyt	2025-11-27 16:04:29.802	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
5	dfdfghjklsa	2025-11-27 16:04:39.516	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
6	qwertyuiop	2025-11-27 16:04:46.839	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
106	monica lorenagonzalez	2025-11-27 16:41:12.731	8	759.000000000000000000000000000000	20601.428571428572000000000000000000	2025-12-17	19571.357142857140000000000000000000	1	2025-11-27 20:58:31.143	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
107	abcdefghijkl	2025-11-27 16:41:43.232	8	759.000000000000000000000000000000	20601.428571428572000000000000000000	2025-12-17	19571.357142857140000000000000000000	1	2025-11-27 20:58:31.143	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
108	monicalorenagonzale	2025-11-27 16:42:17.771	8	758.000000000000000000000000000000	20574.285714285714000000000000000000	2025-12-17	19545.571428571428000000000000000000	1	2025-11-27 20:58:31.143	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
92	gfdsanjjdfgdffzdcxzvxgc	2025-11-27 16:37:29.519	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
93	fhgdfdgfdytdhfgfgdhgf	2025-11-27 16:37:36.37	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
94	fhjfhfgdcgcfhfjffkjk	2025-11-27 16:37:48.258	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
95	hjgjhghfgdfgdshytfriukjk	2025-11-27 16:37:55.034	7	366.000000000000000000000000000000	10980.000000000000000000000000000000	2025-12-17	10431.000000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
73	jghfgfdfsgtrytuk,ghjfgr	2025-11-27 16:29:37.363	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
74	jghdgfdtrfukoij	2025-11-27 16:29:41.276	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
75	hjghgdgfdhyfryugiuhjkhjf	2025-11-27 16:29:50.26	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
76	kjhhjfgdgfdeytrtuyikyfdr	2025-11-27 16:29:56.193	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
77	hjghjfvgcdgfsdstuylijkfg	2025-11-27 16:30:02.079	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
78	mjghfgfkjkjghg	2025-11-27 16:30:09.422	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
79	hjjgdfsrestgfrjyuhyjlmjh	2025-11-27 16:30:14.349	5	981.000000000000000000000000000000	9810.000000000000000000000000000000	2025-12-22	9613.800000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
80	jhjfgfdssyhgtkuhjkgdgfdu	2025-11-27 16:30:20.566	5	982.000000000000000000000000000000	9820.000000000000000000000000000000	2025-12-22	9623.600000000000000000000000000000	1	2025-11-27 21:22:04.765	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
81	gfhhfgfhfhfdgfdhfh	2025-11-27 16:31:45.48	6	983.000000000000000000000000000000	9830.000000000000000000000000000000	2026-01-06	9338.500000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
82	fghfhgfhgdhgfhfjh	2025-11-27 16:32:02.901	6	983.000000000000000000000000000000	9830.000000000000000000000000000000	2026-01-06	9338.500000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
83	vbcbvcgbvchgvnvvcbcnvbc	2025-11-27 16:32:15.357	6	983.000000000000000000000000000000	9830.000000000000000000000000000000	2026-01-06	9338.500000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
84	hffdgfrryuiuiuyutytgfchj	2025-11-27 16:33:16.501	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
85	ghfhgfjjghfhgfjhjjdfhjg	2025-11-27 16:34:57.147	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
86	hgfdsaqwerty	2025-11-27 16:35:14.208	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
87	gfdsaqweerrttu	2025-11-27 16:35:25.21	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
88	hhhghghfdjuygiuhyuygyufr	2025-11-27 16:36:41.667	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
89	gffddsgjfjhghjgsfyusaf	2025-11-27 16:36:48.144	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
90	jfhkjshfusdhyuyrhdefrkjn	2025-11-27 16:36:53.99	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
91	dshfshfhdskjhfushyfusehf	2025-11-27 16:36:59.797	6	982.000000000000000000000000000000	9820.000000000000000000000000000000	2026-01-06	9329.000000000000000000000000000000	1	2025-11-27 21:22:12.871	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
1	E28069150000501CFAE6B22F	2025-11-27 16:03:53.493	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-11-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
7	asdfghjklo	2025-11-27 16:04:57.102	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
8	zxcvbnmasd	2025-11-27 16:05:04.341	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
9	zxcvbnm,.;lk	2025-11-27 16:05:13.599	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
10	xcvgfdsazertyu	2025-11-27 16:05:21.946	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
11	zsaqwsxcderfv	2025-11-27 16:05:28.685	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
12	vfrtgbnhyjl	2025-11-27 16:05:38.318	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
13	bgtyhnjuikmlop;	2025-11-27 16:05:47.126	1	983.000000000000000000000000000000	9830.000000000000000000000000000000	2025-12-27	9338.500000000000000000000000000000	1	2025-11-27 20:35:08.341	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
24	mnbvcxzzasdfg	2025-11-27 16:10:27.486	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
25	oiuyttrrewwqqaasdff	2025-11-27 16:10:31.409	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
26	lkjhjgfddsaqwertyiolo	2025-11-27 16:10:37.422	2	239.000000000000000000000000000000	2390.000000000000000000000000000000	2025-12-27	2270.500000000000000000000000000000	1	2025-11-27 20:35:27.219	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
38	hgfdsaswfrjkhylkhklj	2025-11-27 16:17:10.377	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
39	jhdhshfkssfs	2025-11-27 16:17:26.279	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
40	ssgdgsssshdghdsgs	2025-11-27 16:17:31.629	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
41	gdgdgfdsgfsgsgsgdsgds	2025-11-27 16:17:37.02	3	238.000000000000000000000000000000	2380.000000000000000000000000000000	2025-12-22	2332.400000000000000000000000000000	1	2025-11-27 20:37:44.729	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
109	uyufgsrgiewhfkhglojegl	2025-11-27 16:42:23.212	8	759.000000000000000000000000000000	20601.428571428572000000000000000000	2025-12-17	19571.357142857140000000000000000000	1	2025-11-27 20:58:31.143	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
96	jhgfhfgdfsfeseytrujhkjmh	2025-11-27 16:38:38.42	7	366.000000000000000000000000000000	10980.000000000000000000000000000000	2025-12-17	10431.000000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
97	hfgdfsfddeytjuhyjhjf	2025-11-27 16:38:43.64	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
98	jhgfgdfsfthylk	2025-11-27 16:38:49.994	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
99	hjghfgsgsyujuhlkhjfhgdhg	2025-11-27 16:38:57.928	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
100	hjjghfdgrdshytulikjhjfhg	2025-11-27 16:39:03.909	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
101	hgyugtyufdhjfjfvkjgyhjfk	2025-11-27 16:39:09.879	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
102	jhjhffdyugtoikhfhk	2025-11-27 16:39:15.51	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
103	lmonica lorena	2025-11-27 16:39:25.288	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
104	monica loeena	2025-11-27 16:39:39.698	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
105	monicalorenagonzal	2025-11-27 16:39:57.695	7	365.000000000000000000000000000000	10950.000000000000000000000000000000	2025-12-17	10402.500000000000000000000000000000	1	2025-11-27 21:06:31.705	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
54	nbvhfjhfkjkjhjfhtrfujy	2025-11-27 16:24:17.55	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
55	jhfhgdhtdejueiufdhjgftkj	2025-11-27 16:24:34.706	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
56	hjkjgghfyteuyriytlolgjhy	2025-11-27 16:24:40.76	4	521.000000000000000000000000000000	5210.000000000000000000000000000000	2025-12-22	5105.800000000000000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
57	hjghgfdhgfhyfruiu	2025-11-27 16:24:45.679	4	521.000000000000000000000000000000	5210.000000000000000000000000000000	2025-12-22	5105.800000000000000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
58	hgfhdjdjufkgloupjukugyfr	2025-11-27 16:24:49.851	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
59	jhghjdhgdkgljhk,nmvgfd	2025-11-27 16:24:53.191	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
60	hhgfhjukiyhjmnnvgfd	2025-11-27 16:24:56.424	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
61	cxfdhjukhl;jlkhjfhtfr	2025-11-27 16:25:00.815	4	521.000000000000000000000000000000	5210.000000000000000000000000000000	2025-12-22	5105.800000000000000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
62	hghgfhgfdjdjfjh	2025-11-27 16:25:16.393	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
63	nbncgfdhyfrjugtkyhiughjy	2025-11-27 16:25:25.139	4	521.000000000000000000000000000000	5210.000000000000000000000000000000	2025-12-22	5105.800000000000000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
64	nhjkgdgfrdejuygtkiiuyhju	2025-11-27 16:25:30.908	4	522.000000000000000000000000000000	5220.000000000000000000000000000000	2025-12-22	5115.599999999999000000000000000000	1	2025-11-27 21:15:50.452	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
129	alkfdjlskjlsak	2025-11-28 21:12:04.1	9	984.000000000000000000000000000000	35424.000000000000000000000000000000	2025-12-18	1771.000000000000000000000000000000	1	2025-11-28 21:13:24.994	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
130	aksdksajdlsakk	2025-11-28 21:12:08.927	9	983.000000000000000000000000000000	35388.000000000000000000000000000000	2025-12-18	1769.000000000000000000000000000000	1	2025-11-28 21:13:24.994	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
131	aksdhlsakhdlsahlaks	2025-11-28 21:12:11.69	9	984.000000000000000000000000000000	35424.000000000000000000000000000000	2025-12-18	1771.000000000000000000000000000000	1	2025-11-28 21:13:24.994	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
132	kjdkkfjsakcdksadxkas	2025-11-28 21:12:14.633	9	984.000000000000000000000000000000	35424.000000000000000000000000000000	2025-12-18	1771.000000000000000000000000000000	1	2025-11-28 21:13:24.994	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
133	apwflksdfhlkdsfkhys	2025-11-28 21:12:34.937	10	515.000000000000000000000000000000	25750.000000000000000000000000000000	2025-12-18	1288.000000000000000000000000000000	1	2025-11-28 21:13:31.81	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
134	lkuokulokjlkj;lu	2025-11-28 21:12:40.977	10	546.000000000000000000000000000000	27300.000000000000000000000000000000	2025-12-18	1365.000000000000000000000000000000	1	2025-11-28 21:13:31.81	\N	\N	\N	\N	\N	\N	\N	2	\N	1003
135	1234567804567890	2025-12-09 22:08:08.999	6	973.000000000000000000000000000000	9730.000000000000000000000000000000	2026-01-18	389.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
136	345yujhg7o76yu65	2025-12-09 22:08:17.16	6	973.000000000000000000000000000000	9730.000000000000000000000000000000	2026-01-18	389.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
137	45th6yjmku6tygtrffjkygfc	2025-12-09 22:08:22.046	6	973.000000000000000000000000000000	9730.000000000000000000000000000000	2026-01-18	389.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
138	000000000000000000010000	2025-12-09 22:08:42.492	6	973.000000000000000000000000000000	9730.000000000000000000000000000000	2026-01-18	389.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
139	d5tg6y7hyyggtevbfgocfdsd	2025-12-09 22:08:57.821	6	973.000000000000000000000000000000	9730.000000000000000000000000000000	2026-01-18	389.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
140	qajypshobnfroyiou	2025-12-09 22:09:33.572	6	974.000000000000000000000000000000	9740.000000000000000000000000000000	2026-01-18	390.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
141	k<ae8y[u7hpy	2025-12-09 22:10:13.042	6	973.000000000000000000000000000000	9730.000000000000000000000000000000	2026-01-18	389.000000000000000000000000000000	3	2025-12-09 22:11:20.907	\N	\N	\N	\N	\N	\N	\N	2	\N	2005
\.


--
-- Data for Name: ESTACIONES; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ESTACIONES" (id_estacion, id_frigorifico, clave_vinculacion, activa) FROM stdin;
1003	1	1001003hLWrDXyiCr	t
2005	2	2002005I7TXn1BxKF	t
\.


--
-- Data for Name: ESTADO_EMPAQUE; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ESTADO_EMPAQUE" (id_estado_empaque, nombre_estado) FROM stdin;
1	EN FRIGORIFICO
2	EN LOGISTICA
3	EN NEVERA
4	PENDIENTE PAGO
5	PARA CAMBIO
6	EN LOGISTICA PRIORIDAD
7	VENCIDO/PERDIDA
8	FINALIZADO CON EXITO
\.


--
-- Data for Name: ESTADO_NEVERA; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ESTADO_NEVERA" (id_estado_nevera, estado_nevera) FROM stdin;
1	Inactiva
2	Activa
3	Retirada
4	En Bodega
5	Surtiendo
\.


--
-- Data for Name: ESTADO_TRANSACCION; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ESTADO_TRANSACCION" (id_estado_transaccion, nombre_estado) FROM stdin;
1	PENDIENTE
2	PAGADO
3	ANULADO
4	CONSOLIDADO
\.


--
-- Data for Name: FRIGORIFICO; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."FRIGORIFICO" (id_frigorifico, id_usuario, nombre_frigorifico, direccion, id_ciudad) FROM stdin;
1	3	FRIGOTUN	24 1558	1
2	5	estacion de frigro dos	la leona	1
\.


--
-- Data for Name: ITEMS_DE_REPRODUCCION; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ITEMS_DE_REPRODUCCION" (id, id_lista_reproduccion, id_biblioteca, tiempo_reproduccion_s, orden_reproduccion) FROM stdin;
1	1	1	20	1
2	1	2	20	2
3	1	3	30	3
\.


--
-- Data for Name: LISTA_DE_REPRODUCCION; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."LISTA_DE_REPRODUCCION" (id_lista_reproduccion, nombre, lista_json) FROM stdin;
1	LISTA DIARIA	[{"url": "http://0.0.0.0:8000/local_media/4253351-uhd_4096_2160_25fps.mp4", "type": "video"}, {"url": "https://cdn.pixabay.com/photo/2019/11/04/14/56/chorizo-4601353_1280.jpg", "type": "image", "duration_seconds": 20}]
\.


--
-- Data for Name: LOGISTICA; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."LOGISTICA" (id_logistica, id_usuario, nombre_empresa, placa_vehiculo) FROM stdin;
1	6	la van negra	EPL196
3	7	empresa dos logistica	EPL196
\.


--
-- Data for Name: NEVERAS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."NEVERAS" (id_nevera, "contraseña", id_estado_nevera, id_tienda, version_software, ultima_conexion, id_lista_reproduccion) FROM stdin;
3	VIHM*2WC7KZR	2	1	0.000000000000000000000000000000	\N	\N
5	A7N&995M1!PP	2	2	0.000000000000000000000000000000	\N	\N
8	4(6H)E2YUH*C	2	3	0.000000000000000000000000000000	\N	\N
9	NMUTLMW6GCN1	2	4	0.000000000000000000000000000000	\N	\N
10	54C4RTLC!GLW	2	3	0.000000000000000000000000000000	\N	\N
14	$ZNDY@TD^$NB	1	7	0.000000000000000000000000000000	\N	\N
16	NV&6KH7H*1$8	1	2	0.000000000000000000000000000000	\N	\N
7	##YI+521GQ6R	2	2	0.000000000000000000000000000000	\N	\N
11	5C!70Y^#2F+5	2	5	0.000000000000000000000000000000	\N	\N
12	(KZDU71E3!FA	2	6	0.000000000000000000000000000000	\N	\N
6	M^8P+IZ+U^(L	2	1	0.000000000000000000000000000000	\N	\N
\.


--
-- Data for Name: PERMISOS_ROLES; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."PERMISOS_ROLES" (id_rol_creador, id_rol_creable) FROM stdin;
1	2
2	3
2	4
4	5
\.


--
-- Data for Name: PRODUCTOS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."PRODUCTOS" (id_producto, nombre_producto, descripcion_producto, peso_nominal_g, precio_venta, dias_vencimiento, precio_frigorifico, alta, baja, media) FROM stdin;
8	chorizo	de cerdo *7	700	19000.000000000000000000000000000000	20	5.000000000000000000000000000000	\N	\N	\N
7	chorizo	de cerdo *3	300	9000.000000000000000000000000000000	20	3.000000000000000000000000000000	\N	\N	\N
6	panceta	panceta 1000g	1000	10000.000000000000000000000000000000	40	4.000000000000000000000000000000	\N	\N	\N
5	costilla cerdo	costilla cerdo 1000g	1000	10000.000000000000000000000000000000	25	4.000000000000000000000000000000	\N	\N	\N
4	costilla cerdo	costilla cerdo 500g	500	5000.000000000000000000000000000000	25	4.000000000000000000000000000000	\N	\N	\N
3	costilla cerdo	costilla cerdo 250g	250	2500.000000000000000000000000000000	25	4.000000000000000000000000000000	\N	\N	\N
2	lomo cerdo	lomo cerdo 250g	250	2500.000000000000000000000000000000	30	4.000000000000000000000000000000	\N	\N	\N
1	lomo cerdo	lomo cerdo 1000g	1000	20000.000000000000000000000000000000	30	7.000000000000000000000000000000	\N	\N	\N
9	producto nuevo	producto de prueba despues de proceso	1000	36000.000000000000000000000000000000	20	5.000000000000000000000000000000	\N	\N	\N
10	prducto dos	prueba de prodcuto dos	500	25000.000000000000000000000000000000	20	5.000000000000000000000000000000	\N	\N	\N
\.


--
-- Data for Name: PROMOCIONES; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."PROMOCIONES" (id_promocion, nombre, tipo, valor) FROM stdin;
1	20% Descuento	PORCENTAJE	20.000000000000000000000000000000
2	2x1 (50% en 2da unidad)	BOGOF	50.000000000000000000000000000000
3	50% Descuento	PORCENTAJE	50.000000000000000000000000000000
4	Liquidación Total	PORCENTAJE	80.000000000000000000000000000000
\.


--
-- Data for Name: REFRESH_TOKENS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."REFRESH_TOKENS" (id_refresh_token, id_usuario, token, expira_en, fecha_creacion) FROM stdin;
70	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsIm5vbmNlIjoiNzg1YzJjYTctMmQwNi00MmNhLThjMmEtYzU4MThiNjMyYmQwIiwiaWF0IjoxNzY0MjkwMjE5LCJleHAiOjE3NjQyOTA4MjN9.VjGPoQtfsYXGmyJYHA78aqA1gkD_pkViUtYl37buU3U	2025-12-05 00:36:59.469	2025-11-28 00:36:59.47
75	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTc2NDM2MTk1NCwiZXhwIjoxNzY0MzYyNTU4fQ.HWkhcYC9n7KRlOixZLAknvpWob0q-SJjh3WPqmvBCZ4	2025-12-05 20:32:34.586	2025-11-28 20:32:34.587
91	4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsIm5vbmNlIjoiMmI1NWNmMDgtM2FhMi00ZDRjLWExZWUtYzY3N2YyZjY4ZTk5IiwiaWF0IjoxNzY0NDMzNjU2LCJleHAiOjE3NjQ0MzQyNjB9.1zhCr77smAjVTBaPIRbbl1D1Koq9AkzM9yFI2ObYEGk	2025-12-06 16:27:36.563	2025-11-29 16:27:36.564
101	6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsIm5vbmNlIjoiNzVhNmM3MzAtMGI2Ny00M2Q2LThhZDQtYWU3ZDYyNGE3NGI2IiwiaWF0IjoxNzY1MzE2ODEzLCJleHAiOjE3NjUzMTc0MTd9.MFsqGWBxEaw0T9HKNlrQ8NT1d4EmPEratEXf7MG8Hmg	2025-12-16 21:46:53.445	2025-12-09 21:46:53.448
104	7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsImlhdCI6MTc2NTMxODMyOSwiZXhwIjoxNzY1MzE4OTMzfQ.7s1ca9kgcAJ2AemXIg2hHW88BltVssqg_YKT9lJeeek	2025-12-16 22:12:09.886	2025-12-09 22:12:09.888
\.


--
-- Data for Name: REPORTE_ESTADO_NEVERAS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."REPORTE_ESTADO_NEVERAS" (id_reporte_estado, id_nevera, hora_reporte, evento, temperatura_c, id_temperatura_nevera) FROM stdin;
\.


--
-- Data for Name: ROLES; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ROLES" (id_rol, nombre_rol) FROM stdin;
1	Super_Admin
2	Admin
3	Frigorifico
4	Logistica
5	Tienda
\.


--
-- Data for Name: STOCK_NEVERA; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."STOCK_NEVERA" (id, id_nevera, id_producto, stock_minimo, stock_maximo, venta_semanal, stock_ideal_final, calificacion_surtido, mensaje_sistema, stock_en_tiempo_real, hora_calificacion, activo) FROM stdin;
42	12	6	2	11	0	11	MEDIA	\N	0	2025-11-28 21:21:09.515	t
52	5	10	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
54	7	10	0	0	0	0	MEDIA	\N	0	2025-11-29 17:21:35.688	t
48	12	3	3	15	0	15	MEDIA	\N	0	2025-11-28 21:21:09.515	t
55	11	10	0	0	0	0	MEDIA	\N	0	2025-11-29 17:21:35.688	t
45	6	3	0	3	0	3	MEDIA	\N	0	2025-11-28 21:21:44.057	t
21	6	5	1	4	0	4	MEDIA	\N	0	2025-11-28 21:21:44.057	t
15	6	1	0	3	0	3	MEDIA	\N	0	2025-11-28 21:21:44.057	t
8	5	7	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
6	12	8	1	4	0	4	MEDIA	\N	0	2025-11-28 21:21:09.515	t
10	7	7	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
49	12	10	0	2	0	2	MEDIA	\N	0	2025-11-28 21:21:09.515	t
35	11	2	0	2	0	2	MEDIA	\N	0	2025-11-29 17:21:35.688	t
50	12	9	1	4	0	4	MEDIA	\N	0	2025-11-28 21:21:09.515	t
11	11	7	0	2	0	2	MEDIA	\N	0	2025-11-29 17:21:35.688	t
23	11	5	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
56	3	9	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
57	5	9	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
59	7	9	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
39	6	6	0	2	0	2	MEDIA	\N	0	2025-11-28 21:21:44.057	t
53	6	10	0	1	0	1	MEDIA	\N	0	2025-11-28 21:21:44.057	t
58	6	9	0	1	0	1	MEDIA	\N	0	2025-11-28 21:21:44.057	t
13	3	1	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
14	5	1	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
60	11	9	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
16	7	1	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
1	3	8	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
17	11	1	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
25	3	4	1	6	0	6	MEDIA	\N	0	2025-11-29 17:21:35.688	t
26	5	4	1	6	0	6	MEDIA	\N	0	2025-11-29 17:21:35.688	t
3	6	8	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
37	3	6	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
38	5	6	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
2	5	8	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
28	7	4	1	6	0	6	MEDIA	\N	0	2025-11-29 17:21:35.688	t
29	11	4	1	5	0	5	MEDIA	\N	0	2025-11-29 17:21:35.688	t
40	7	6	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
41	11	6	0	2	0	2	MEDIA	\N	0	2025-11-29 17:21:35.688	t
43	3	3	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
4	7	8	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
5	11	8	0	0	0	0	MEDIA	\N	0	2025-11-29 17:21:35.688	t
7	3	7	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
31	3	2	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
44	5	3	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
19	3	5	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
12	12	7	3	14	0	14	MEDIA	\N	0	2025-11-28 21:21:09.515	t
20	5	5	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
18	12	1	3	13	0	13	MEDIA	\N	0	2025-11-28 21:21:09.515	t
33	6	2	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
24	12	5	4	16	0	16	MEDIA	\N	0	2025-11-28 21:21:09.515	t
22	7	5	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
46	7	3	1	4	0	4	MEDIA	\N	0	2025-11-29 17:21:35.688	t
51	3	10	0	1	0	1	MEDIA	\N	0	2025-11-29 17:21:35.688	t
32	5	2	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
47	11	3	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
34	7	2	0	2	0	2	MEDIA	\N	0	2025-11-29 17:21:35.688	t
30	12	4	5	23	0	23	MEDIA	\N	0	2025-11-28 21:21:09.515	t
9	6	7	0	3	0	3	MEDIA	\N	0	2025-11-29 17:21:35.688	t
36	12	2	3	13	0	13	MEDIA	\N	0	2025-11-28 21:21:09.515	t
27	6	4	1	5	0	5	MEDIA	\N	0	2025-11-28 21:21:44.057	t
\.


--
-- Data for Name: TEMPERATURA_NEVERA; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TEMPERATURA_NEVERA" (id_temperatura_nevera, nombre_estado) FROM stdin;
1	OK
2	Fuera de rango 0° - 4°
3	Falla sensor
4	Desconocido
\.


--
-- Data for Name: TIENDAS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TIENDAS" (id_tienda, id_usuario, nombre_tienda, direccion, id_ciudad) FROM stdin;
1	8	teinda uno	sanaidjshassa	2
2	8	tienda dos de la uno	wdcwscsdcsd	2
3	9	tienda de prueba segunda rama	segunda rama	1
4	9	segunda tienda de admin dos	assasasasa	1
5	8	tienda 3	sadcsacxasc	2
6	8	tienda cuatro	asdasdsa	4
7	8	de la esquina	dsfrgrgvbrtgwsrggvbrsdtfgvb	3
\.


--
-- Data for Name: TIPO_TRANSACCION; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TIPO_TRANSACCION" (id_tipo, nombre_codigo, descripcion_amigable) FROM stdin;
1	venta	Venta de empaque en la tienda
2	costo_frigorifico	Deuda de logística con frigorífico
3	ticket_consolidado	Ticket que agrupa varias transacciones
4	pago_recibido	Dinero recibido de un deudor
5	pago_realizado	Dinero entregado a un acreedor
6	devolucion	Anulación de una venta
7	perdida_vencimiento	Ajuste por producto vencido
8	gasto_operativo	Gasto (ej. gasolina)
\.


--
-- Data for Name: TOKEN_REGISTRO; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TOKEN_REGISTRO" (id, token, creado_en, expira_en, es_usado, id_usuario_creador, id_rol_nuevo_usuario, id_usuario_nuevo) FROM stdin;
1	e455d3074a2587ff8c8016c8c013e50fdb8fac8f5611b2b7	2025-11-27 14:48:28.614	2025-11-27 15:48:28.613	t	1	2	2
5	4e1052a13fab07b8c79cb9f57ed89dbb289a19ea91c6135b	2025-11-27 14:53:33.533	2025-11-27 15:53:33.531	t	2	3	3
7	418ee758b2b9faee98db1d4b32a4c57c1b4364679e34d8b2	2025-11-27 16:38:59.678	2025-11-27 17:38:59.677	t	1	2	4
8	0a931c9ba79bf37466166de1a1f3c433042cb8d25983e056	2025-11-27 16:40:11.839	2025-11-27 17:40:11.837	t	4	3	5
9	07f4ebd3b43a4014ddff0ab137aa044b43082391ba140896	2025-11-27 20:06:17.205	2025-11-27 21:06:17.203	t	2	4	6
10	9e238b41de61a2c0210bee5c337d2036a0e72ff8d3642fb2	2025-11-27 20:23:09.872	2025-11-27 21:23:09.871	t	4	4	7
11	ca405e9473407ce440a21c597ddb0548299bfc1374018d4d	2025-11-27 22:12:14.532	2025-11-27 23:12:14.53	t	6	5	8
12	3f34cc2313e5d4ee4295f73cd0f71df232c40ecd307862c4	2025-11-27 22:41:41.873	2025-11-27 23:41:41.872	t	7	5	9
13	33bbf5cffbb696f4dd66b16f5e3d52840b83cd0602bba694	2025-11-28 00:11:19.639	2025-11-28 01:11:19.638	f	6	5	\N
\.


--
-- Data for Name: TRANSACCIONES; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TRANSACCIONES" (id_transaccion, id_empaque, id_usuario, id_transaccion_rel, monto, hora_transaccion, id_tipo_transaccion, nota_opcional, estado_transaccion) FROM stdin;
1	117	5	\N	9253.000000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
2	118	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
3	119	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
4	120	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
5	121	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
6	122	5	\N	9253.000000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
7	123	5	\N	9253.000000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
8	124	5	\N	9253.000000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
9	125	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
10	126	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
11	127	5	\N	9262.500000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
12	128	5	\N	9253.000000000000000000000000000000	2025-11-27 20:29:57.552	2	Transacción Producto ID : 1	1
13	110	5	\N	5056.800000000000000000000000000000	2025-11-27 20:30:04.658	2	Transacción Producto ID : 4	1
14	111	5	\N	5056.800000000000000000000000000000	2025-11-27 20:30:04.658	2	Transacción Producto ID : 4	1
15	112	5	\N	5056.800000000000000000000000000000	2025-11-27 20:30:04.658	2	Transacción Producto ID : 4	1
16	113	5	\N	9272.000000000000000000000000000000	2025-11-27 20:34:02.905	2	Transacción Producto ID : 6	1
17	114	5	\N	9272.000000000000000000000000000000	2025-11-27 20:34:02.905	2	Transacción Producto ID : 6	1
18	115	5	\N	9272.000000000000000000000000000000	2025-11-27 20:34:02.905	2	Transacción Producto ID : 6	1
19	116	5	\N	9272.000000000000000000000000000000	2025-11-27 20:34:02.905	2	Transacción Producto ID : 6	1
104	65	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
105	66	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
106	67	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
107	68	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
108	69	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
109	70	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
110	71	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
111	72	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
112	73	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
113	74	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
114	75	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
115	76	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
116	77	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
117	78	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
118	79	3	132	9613.799999999999000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
119	80	3	132	9623.600000000000000000000000000000	2025-11-27 21:22:04.765	2	Transacción Producto ID : 5	2
120	81	3	132	9338.500000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
121	82	3	132	9338.500000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
122	83	3	132	9338.500000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
123	84	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
124	85	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
125	86	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
126	87	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
127	88	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
128	89	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
129	90	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
130	91	3	132	9329.000000000000000000000000000000	2025-11-27 21:22:12.871	2	Transacción Producto ID : 6	2
131	\N	6	\N	-260000.000000000000000000000000000000	2025-11-27 21:29:53.262	5	abono de $ 260.000 hecho por el usuario logistica logistica uno (ID: 6) - Monto abonado: 260000	2
132	\N	3	131	-256615.000000000000000000000000000000	2025-11-27 21:29:53.272	3	65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91	4
102	\N	6	\N	-527465.000000000000000000000000000000	2025-11-27 21:16:48.459	5	pago por el usuario logistica uno (ID: 6) - Monto abonado: 527465	2
103	\N	3	102	-527465.000000000000000000000000000000	2025-11-27 21:16:48.472	3	1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,106,107,108,109,92,93,94,95,96,97,98,99,100,101,102,103,104,105,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64	4
20	1	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
21	2	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
22	3	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
23	4	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
24	5	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
25	6	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
26	7	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
27	8	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
28	9	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
29	10	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
30	11	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
31	12	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
32	13	3	103	9338.500000000000000000000000000000	2025-11-27 20:35:08.341	2	Transacción Producto ID : 1	2
33	14	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
34	15	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
35	16	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
36	17	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
37	18	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
38	19	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
39	20	3	103	2261.000000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
40	21	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
41	22	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
42	23	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
43	24	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
44	25	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
45	26	3	103	2270.500000000000000000000000000000	2025-11-27 20:35:27.219	2	Transacción Producto ID : 2	2
46	27	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
47	28	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
48	29	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
49	30	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
50	31	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
51	32	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
52	33	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
53	34	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
54	35	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
55	36	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
56	37	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
57	38	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
58	39	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
59	40	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
60	41	3	103	2332.400000000000000000000000000000	2025-11-27 20:37:44.729	2	Transacción Producto ID : 3	2
61	106	3	103	19571.357142857140000000000000000000	2025-11-27 20:58:31.143	2	Transacción Producto ID : 8	2
62	107	3	103	19571.357142857140000000000000000000	2025-11-27 20:58:31.143	2	Transacción Producto ID : 8	2
63	108	3	103	19545.571428571430000000000000000000	2025-11-27 20:58:31.143	2	Transacción Producto ID : 8	2
64	109	3	103	19571.357142857140000000000000000000	2025-11-27 20:58:31.143	2	Transacción Producto ID : 8	2
65	92	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
66	93	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
67	94	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
68	95	3	103	10431.000000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
69	96	3	103	10431.000000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
70	97	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
71	98	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
72	99	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
73	100	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
74	101	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
75	102	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
76	103	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
77	104	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
78	105	3	103	10402.500000000000000000000000000000	2025-11-27 21:06:31.705	2	Transacción Producto ID : 7	2
79	42	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
80	43	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
81	44	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
82	45	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
83	46	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
84	47	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
85	48	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
86	49	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
87	50	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
88	51	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
89	52	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
90	53	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
91	54	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
92	55	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
93	56	3	103	5105.800000000000000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
94	57	3	103	5105.800000000000000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
95	58	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
96	59	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
97	60	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
98	61	3	103	5105.800000000000000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
99	62	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
100	63	3	103	5105.800000000000000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
101	64	3	103	5115.599999999999000000000000000000	2025-11-27 21:15:50.452	2	Transacción Producto ID : 4	2
140	\N	6	\N	-6350.000000000000000000000000000000	2025-12-09 21:39:40.504	5	pago por el usuario logistica uno (ID: 6) - Monto abonado: 6350	2
141	\N	3	140	-6350.000000000000000000000000000000	2025-12-09 21:39:40.518	3	129,130,131,132,133,134	4
134	129	3	141	1771.000000000000000000000000000000	2025-11-28 21:13:24.994	2	Transacción Producto ID : 9	2
135	130	3	141	1769.000000000000000000000000000000	2025-11-28 21:13:24.994	2	Transacción Producto ID : 9	2
136	131	3	141	1771.000000000000000000000000000000	2025-11-28 21:13:24.994	2	Transacción Producto ID : 9	2
137	132	3	141	1771.000000000000000000000000000000	2025-11-28 21:13:24.994	2	Transacción Producto ID : 9	2
133	\N	3	141	-3385.000000000000000000000000000000	2025-11-27 21:29:53.289	2	Saldo adelantado pendiente consolidación 132	2
138	133	3	141	1288.000000000000000000000000000000	2025-11-28 21:13:31.81	2	Transacción Producto ID : 10	2
139	134	3	141	1365.000000000000000000000000000000	2025-11-28 21:13:31.81	2	Transacción Producto ID : 10	2
142	135	5	\N	389.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
143	136	5	\N	389.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
144	137	5	\N	389.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
145	138	5	\N	389.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
146	139	5	\N	389.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
147	140	5	\N	390.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
148	141	5	\N	389.000000000000000000000000000000	2025-12-09 22:11:20.907	2	Transacción Producto ID : 6	1
\.


--
-- Data for Name: USUARIOS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."USUARIOS" (id_usuario, nombre_usuario, apellido_usuario, identificacion_usuario, celular, email, "contraseña", activo, fecha_creacion, fecha_ultima_modifi, id_rol) FROM stdin;
1	juan	juan	1114399152	3214568798.000000000000000000000000000000	juanbitcoin988@gmail.com	$2b$10$5oQU1xN1pnabyYSWHoPL1uS1DBsL2/Yx3Ucc.eOTB1oz.KgONjv1C	t	2025-11-27 14:30:36.287	2025-11-27 14:30:36.287	1
2	juan admin	arcila	111439915	2222222222.000000000000000000000000000000	superadmin@vorak.com	$2b$10$M8jdFOXptNbHMQZG8StsCeyt4xe9RJ45cxm1i.z/XFCQ5VAP8tXeq	t	2025-11-27 14:53:09.873	2025-11-27 14:53:09.873	2
3	frigorifico	uno	54565646	3432433344.000000000000000000000000000000	frigoprueba2@frigo.com	$2b$10$4J38I2KICiMF5qYRHzBUduG.3CTgYCvTbvqeygQCrM55C8ENkWgyq	t	2025-11-27 14:54:11.927	2025-11-27 16:38:27.121	3
4	admindos	dos	1234456667	4665465656.000000000000000000000000000000	admindos@vorak.app	$2b$10$TGsoP3GZVazGELsinZvaUeiaJN.5LirhV9xoTa1ty37tlV4BLl09i	t	2025-11-27 16:39:52.975	2025-11-27 16:39:52.975	2
5	frigrorifico	dos de admin dos	777777777	4554544554.000000000000000000000000000000	frigoadmindos@vorak.app	$2b$10$7qhG4RBju3Nw9KE7hVP/uewHg/Vy8.RI9Qp3Ctm.b02dyLPzbj.HO	t	2025-11-27 16:41:26.247	2025-11-27 16:41:26.247	3
6	logistica	uno	3333333	5555555555.000000000000000000000000000000	logistica@vorak.com	$2b$10$PLhFmQg2wGisgoSYkdxxg.HCQ9chRyHKg2M2W9DgLgcKiURF/R1NS	t	2025-11-27 20:06:52.424	2025-11-27 20:21:53.58	4
7	LOGISTICAADMINDOS	DOS	838383838	8383838383.000000000000000000000000000000	logistica@logistica.com	$2b$10$ftHNPrxCzmMAQe2yMaB0yOz7xNdwjCSOr53nm2uszqOSIAOBzMdNy	t	2025-11-27 20:24:02.921	2025-11-27 20:28:28.933	4
8	TIENDAADMINUNO	admin uno	3434556566	8989898989.000000000000000000000000000000	tienda@tienda.com	$2b$10$CIockAWIeX7AfsojJgp5jOOn51wiuVcODbZwv5Z5atAMKFBst9uUu	t	2025-11-27 22:13:05.445	2025-11-27 22:13:05.445	5
9	tienda de admin dos	logisticados	3545423554	7667676767.000000000000000000000000000000	tiendados@tienda.com	$2b$10$5wLv4cA66QeDVvpXhMVXQePWMP0e/6HNbRY6IVh293zkmZ7XDlR9S	t	2025-11-27 22:42:44.501	2025-11-28 00:37:21.597	5
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0b43e5c5-a0ec-4953-b777-4ad345050772	8a2707dc17c19d7177788ba81bd7a16117b5c06cbfb0e215ca9ec6ae24aee701	2025-11-27 13:28:30.420346+00	20251022192701_init	\N	\N	2025-11-27 13:28:30.185866+00	1
3ecc1e94-4193-457e-860d-0da41b82dbde	e9a1378956431a96787340a188bb82ae3e437500e13e101382df40f693b9a95d	2025-11-27 13:28:30.432688+00	20251024014804_add_basculas_table	\N	\N	2025-11-27 13:28:30.421376+00	1
63018c10-3e44-40fd-8d1c-00cedcc771ce	55866b4adf2b945eb7e725c754ee200ce0b831f824947d31466209dc4dfdd9db	2025-11-27 13:28:30.453504+00	20251025214952_rename_basculas_to_estaciones	\N	\N	2025-11-27 13:28:30.434076+00	1
7295e4a2-1200-475e-9970-adccfcacdb1d	aa347858a97e821966d6909a3206bca2e0c8ec5e8bec10275cad1200d9065acd	2025-11-27 13:28:30.462035+00	20251026013219_change_empaques_to_estacion	\N	\N	2025-11-27 13:28:30.455365+00	1
5ddf62f7-df40-45d1-898d-84ff92d5e125	a55aac120f06f4a653c6eddaf5273ea3bcd4b75ac9f310376cb4f00689771747	2025-11-27 13:28:30.49461+00	20251125140000_fix_drift	\N	\N	2025-11-27 13:28:30.464479+00	1
f6ca7336-bb47-4420-813d-c5607b7373c3	bc5aff8fa466987c03cd11e45b83b5ba1256504e28ccab1caca3654d0bade140	2025-11-27 13:28:30.506392+00	20251125140138_rename_stock_table	\N	\N	2025-11-27 13:28:30.496418+00	1
b9af2d5a-fb25-4013-8e6a-73c0bf6e578c	cafe19547212ff4bdd71bf4f920244c8f5ed9e808fe60bd5078326bd382f3540	2025-11-27 13:28:30.516923+00	20251126162320_add_activo_to_stock_nevera	\N	\N	2025-11-27 13:28:30.507994+00	1
e953f594-4a4a-46b1-af77-076544fc5a74	9520865c57c33ac887fbe3d202192d950f142f8d5059eef2fb4430301c5cdca0	2025-11-27 13:28:30.524918+00	20251126192300_rename_calificacion_sutido_to_surtido	\N	\N	2025-11-27 13:28:30.518135+00	1
6091e942-4b73-46b6-a616-2fe7d1ca8909	4a53a3d676d1109f584fb4daeaa6b68ac57f160ada63835ff104640088191e80	2025-11-27 20:27:50.197263+00	20251127202750_remove_unique_placa_vehiculo	\N	\N	2025-11-27 20:27:50.187822+00	1
\.


--
-- Name: BIBLIOTECA_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."BIBLIOTECA_id_seq"', 1, false);


--
-- Name: CIUDAD_id_ciudad_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."CIUDAD_id_ciudad_seq"', 1, false);


--
-- Name: DEPARTAMENTO_id__departamento_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."DEPARTAMENTO_id__departamento_seq"', 1, false);


--
-- Name: EMPAQUES_id_empaque_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."EMPAQUES_id_empaque_seq"', 141, true);


--
-- Name: ESTACIONES_id_estacion_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ESTACIONES_id_estacion_seq"', 1, false);


--
-- Name: ESTADO_EMPAQUE_id_estado_empaque_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ESTADO_EMPAQUE_id_estado_empaque_seq"', 1, false);


--
-- Name: ESTADO_NEVERA_id_estado_nevera_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ESTADO_NEVERA_id_estado_nevera_seq"', 1, true);


--
-- Name: ESTADO_TRANSACCION_id_estado_transaccion_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ESTADO_TRANSACCION_id_estado_transaccion_seq"', 1, false);


--
-- Name: FRIGORIFICO_id_frigorifico_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."FRIGORIFICO_id_frigorifico_seq"', 2, true);


--
-- Name: ITEMS_DE_REPRODUCCION_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ITEMS_DE_REPRODUCCION_id_seq"', 1, false);


--
-- Name: LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq"', 1, true);


--
-- Name: LOGISTICA_id_logistica_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."LOGISTICA_id_logistica_seq"', 3, true);


--
-- Name: NEVERAS_id_nevera_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."NEVERAS_id_nevera_seq"', 16, true);


--
-- Name: PRODUCTOS_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."PRODUCTOS_id_producto_seq"', 10, true);


--
-- Name: PROMOCIONES_id_promocion_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."PROMOCIONES_id_promocion_seq"', 1, false);


--
-- Name: REFRESH_TOKENS_id_refresh_token_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."REFRESH_TOKENS_id_refresh_token_seq"', 104, true);


--
-- Name: REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."REPORTE_ESTADO_NEVERAS_id_reporte_estado_seq"', 1, false);


--
-- Name: ROLES_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."ROLES_id_rol_seq"', 1, false);


--
-- Name: STOCK_NEVERA_PRODUCTO_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."STOCK_NEVERA_PRODUCTO_id_seq"', 60, true);


--
-- Name: TEMPERATURA_NEVERA_id_temperatura_nevera_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."TEMPERATURA_NEVERA_id_temperatura_nevera_seq"', 1, false);


--
-- Name: TIENDAS_id_tienda_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."TIENDAS_id_tienda_seq"', 7, true);


--
-- Name: TIPO_TRANSACCION_id_tipo_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."TIPO_TRANSACCION_id_tipo_seq"', 1, false);


--
-- Name: TOKEN_REGISTRO_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."TOKEN_REGISTRO_id_seq"', 13, true);


--
-- Name: TRANSACCIONES_id_transaccion_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."TRANSACCIONES_id_transaccion_seq"', 148, true);


--
-- Name: USUARIOS_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."USUARIOS_id_usuario_seq"', 9, true);


--
-- Name: BIBLIOTECA BIBLIOTECA_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."BIBLIOTECA"
    ADD CONSTRAINT "BIBLIOTECA_pkey" PRIMARY KEY (id);


--
-- Name: CIUDAD CIUDAD_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."CIUDAD"
    ADD CONSTRAINT "CIUDAD_pkey" PRIMARY KEY (id_ciudad);


--
-- Name: DEPARTAMENTO DEPARTAMENTO_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DEPARTAMENTO"
    ADD CONSTRAINT "DEPARTAMENTO_pkey" PRIMARY KEY (id__departamento);


--
-- Name: EMPAQUES EMPAQUES_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_pkey" PRIMARY KEY (id_empaque);


--
-- Name: ESTACIONES ESTACIONES_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTACIONES"
    ADD CONSTRAINT "ESTACIONES_pkey" PRIMARY KEY (id_estacion);


--
-- Name: ESTADO_EMPAQUE ESTADO_EMPAQUE_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTADO_EMPAQUE"
    ADD CONSTRAINT "ESTADO_EMPAQUE_pkey" PRIMARY KEY (id_estado_empaque);


--
-- Name: ESTADO_NEVERA ESTADO_NEVERA_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTADO_NEVERA"
    ADD CONSTRAINT "ESTADO_NEVERA_pkey" PRIMARY KEY (id_estado_nevera);


--
-- Name: ESTADO_TRANSACCION ESTADO_TRANSACCION_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTADO_TRANSACCION"
    ADD CONSTRAINT "ESTADO_TRANSACCION_pkey" PRIMARY KEY (id_estado_transaccion);


--
-- Name: FRIGORIFICO FRIGORIFICO_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."FRIGORIFICO"
    ADD CONSTRAINT "FRIGORIFICO_pkey" PRIMARY KEY (id_frigorifico);


--
-- Name: ITEMS_DE_REPRODUCCION ITEMS_DE_REPRODUCCION_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ITEMS_DE_REPRODUCCION"
    ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_pkey" PRIMARY KEY (id);


--
-- Name: LISTA_DE_REPRODUCCION LISTA_DE_REPRODUCCION_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."LISTA_DE_REPRODUCCION"
    ADD CONSTRAINT "LISTA_DE_REPRODUCCION_pkey" PRIMARY KEY (id_lista_reproduccion);


--
-- Name: LOGISTICA LOGISTICA_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."LOGISTICA"
    ADD CONSTRAINT "LOGISTICA_pkey" PRIMARY KEY (id_logistica);


--
-- Name: NEVERAS NEVERAS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."NEVERAS"
    ADD CONSTRAINT "NEVERAS_pkey" PRIMARY KEY (id_nevera);


--
-- Name: PERMISOS_ROLES PERMISOS_ROLES_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PERMISOS_ROLES"
    ADD CONSTRAINT "PERMISOS_ROLES_pkey" PRIMARY KEY (id_rol_creador, id_rol_creable);


--
-- Name: PRODUCTOS PRODUCTOS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PRODUCTOS"
    ADD CONSTRAINT "PRODUCTOS_pkey" PRIMARY KEY (id_producto);


--
-- Name: PROMOCIONES PROMOCIONES_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PROMOCIONES"
    ADD CONSTRAINT "PROMOCIONES_pkey" PRIMARY KEY (id_promocion);


--
-- Name: REFRESH_TOKENS REFRESH_TOKENS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REFRESH_TOKENS"
    ADD CONSTRAINT "REFRESH_TOKENS_pkey" PRIMARY KEY (id_refresh_token);


--
-- Name: REPORTE_ESTADO_NEVERAS REPORTE_ESTADO_NEVERAS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REPORTE_ESTADO_NEVERAS"
    ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_pkey" PRIMARY KEY (id_reporte_estado);


--
-- Name: ROLES ROLES_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ROLES"
    ADD CONSTRAINT "ROLES_pkey" PRIMARY KEY (id_rol);


--
-- Name: STOCK_NEVERA STOCK_NEVERA_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."STOCK_NEVERA"
    ADD CONSTRAINT "STOCK_NEVERA_pkey" PRIMARY KEY (id);


--
-- Name: TEMPERATURA_NEVERA TEMPERATURA_NEVERA_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TEMPERATURA_NEVERA"
    ADD CONSTRAINT "TEMPERATURA_NEVERA_pkey" PRIMARY KEY (id_temperatura_nevera);


--
-- Name: TIENDAS TIENDAS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TIENDAS"
    ADD CONSTRAINT "TIENDAS_pkey" PRIMARY KEY (id_tienda);


--
-- Name: TIPO_TRANSACCION TIPO_TRANSACCION_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TIPO_TRANSACCION"
    ADD CONSTRAINT "TIPO_TRANSACCION_pkey" PRIMARY KEY (id_tipo);


--
-- Name: TOKEN_REGISTRO TOKEN_REGISTRO_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TOKEN_REGISTRO"
    ADD CONSTRAINT "TOKEN_REGISTRO_pkey" PRIMARY KEY (id);


--
-- Name: TRANSACCIONES TRANSACCIONES_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES"
    ADD CONSTRAINT "TRANSACCIONES_pkey" PRIMARY KEY (id_transaccion);


--
-- Name: USUARIOS USUARIOS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."USUARIOS"
    ADD CONSTRAINT "USUARIOS_pkey" PRIMARY KEY (id_usuario);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: EMPAQUES_EPC_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "EMPAQUES_EPC_id_key" ON public."EMPAQUES" USING btree ("EPC_id");


--
-- Name: ESTACIONES_clave_vinculacion_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "ESTACIONES_clave_vinculacion_key" ON public."ESTACIONES" USING btree (clave_vinculacion);


--
-- Name: FRIGORIFICO_direccion_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "FRIGORIFICO_direccion_key" ON public."FRIGORIFICO" USING btree (direccion);


--
-- Name: REFRESH_TOKENS_token_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "REFRESH_TOKENS_token_key" ON public."REFRESH_TOKENS" USING btree (token);


--
-- Name: TIENDAS_direccion_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "TIENDAS_direccion_key" ON public."TIENDAS" USING btree (direccion);


--
-- Name: TOKEN_REGISTRO_id_usuario_nuevo_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "TOKEN_REGISTRO_id_usuario_nuevo_key" ON public."TOKEN_REGISTRO" USING btree (id_usuario_nuevo);


--
-- Name: TOKEN_REGISTRO_token_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "TOKEN_REGISTRO_token_key" ON public."TOKEN_REGISTRO" USING btree (token);


--
-- Name: USUARIOS_celular_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "USUARIOS_celular_key" ON public."USUARIOS" USING btree (celular);


--
-- Name: USUARIOS_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "USUARIOS_email_key" ON public."USUARIOS" USING btree (email);


--
-- Name: USUARIOS_identificacion_usuario_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "USUARIOS_identificacion_usuario_key" ON public."USUARIOS" USING btree (identificacion_usuario);


--
-- Name: CIUDAD CIUDAD_id__departamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."CIUDAD"
    ADD CONSTRAINT "CIUDAD_id__departamento_fkey" FOREIGN KEY (id__departamento) REFERENCES public."DEPARTAMENTO"(id__departamento) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EMPAQUES EMPAQUES_id_estacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_id_estacion_fkey" FOREIGN KEY (id_estacion) REFERENCES public."ESTACIONES"(id_estacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EMPAQUES EMPAQUES_id_estado_empaque_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_id_estado_empaque_fkey" FOREIGN KEY (id_estado_empaque) REFERENCES public."ESTADO_EMPAQUE"(id_estado_empaque) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EMPAQUES EMPAQUES_id_logistica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_id_logistica_fkey" FOREIGN KEY (id_logistica) REFERENCES public."LOGISTICA"(id_logistica) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EMPAQUES EMPAQUES_id_nevera_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_id_nevera_fkey" FOREIGN KEY (id_nevera) REFERENCES public."NEVERAS"(id_nevera) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EMPAQUES EMPAQUES_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_id_producto_fkey" FOREIGN KEY (id_producto) REFERENCES public."PRODUCTOS"(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EMPAQUES EMPAQUES_promocion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."EMPAQUES"
    ADD CONSTRAINT "EMPAQUES_promocion_id_fkey" FOREIGN KEY (promocion_id) REFERENCES public."PROMOCIONES"(id_promocion) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ESTACIONES ESTACIONES_id_frigorifico_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ESTACIONES"
    ADD CONSTRAINT "ESTACIONES_id_frigorifico_fkey" FOREIGN KEY (id_frigorifico) REFERENCES public."FRIGORIFICO"(id_frigorifico) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FRIGORIFICO FRIGORIFICO_id_ciudad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."FRIGORIFICO"
    ADD CONSTRAINT "FRIGORIFICO_id_ciudad_fkey" FOREIGN KEY (id_ciudad) REFERENCES public."CIUDAD"(id_ciudad) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FRIGORIFICO FRIGORIFICO_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."FRIGORIFICO"
    ADD CONSTRAINT "FRIGORIFICO_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ITEMS_DE_REPRODUCCION ITEMS_DE_REPRODUCCION_id_biblioteca_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ITEMS_DE_REPRODUCCION"
    ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_biblioteca_fkey" FOREIGN KEY (id_biblioteca) REFERENCES public."BIBLIOTECA"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ITEMS_DE_REPRODUCCION ITEMS_DE_REPRODUCCION_id_lista_reproduccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ITEMS_DE_REPRODUCCION"
    ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_lista_reproduccion_fkey" FOREIGN KEY (id_lista_reproduccion) REFERENCES public."LISTA_DE_REPRODUCCION"(id_lista_reproduccion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LOGISTICA LOGISTICA_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."LOGISTICA"
    ADD CONSTRAINT "LOGISTICA_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NEVERAS NEVERAS_id_estado_nevera_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."NEVERAS"
    ADD CONSTRAINT "NEVERAS_id_estado_nevera_fkey" FOREIGN KEY (id_estado_nevera) REFERENCES public."ESTADO_NEVERA"(id_estado_nevera) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NEVERAS NEVERAS_id_lista_reproduccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."NEVERAS"
    ADD CONSTRAINT "NEVERAS_id_lista_reproduccion_fkey" FOREIGN KEY (id_lista_reproduccion) REFERENCES public."LISTA_DE_REPRODUCCION"(id_lista_reproduccion) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NEVERAS NEVERAS_id_tienda_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."NEVERAS"
    ADD CONSTRAINT "NEVERAS_id_tienda_fkey" FOREIGN KEY (id_tienda) REFERENCES public."TIENDAS"(id_tienda) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PERMISOS_ROLES PERMISOS_ROLES_id_rol_creable_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PERMISOS_ROLES"
    ADD CONSTRAINT "PERMISOS_ROLES_id_rol_creable_fkey" FOREIGN KEY (id_rol_creable) REFERENCES public."ROLES"(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PERMISOS_ROLES PERMISOS_ROLES_id_rol_creador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PERMISOS_ROLES"
    ADD CONSTRAINT "PERMISOS_ROLES_id_rol_creador_fkey" FOREIGN KEY (id_rol_creador) REFERENCES public."ROLES"(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: REFRESH_TOKENS REFRESH_TOKENS_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REFRESH_TOKENS"
    ADD CONSTRAINT "REFRESH_TOKENS_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: REPORTE_ESTADO_NEVERAS REPORTE_ESTADO_NEVERAS_id_nevera_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REPORTE_ESTADO_NEVERAS"
    ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_nevera_fkey" FOREIGN KEY (id_nevera) REFERENCES public."NEVERAS"(id_nevera) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: REPORTE_ESTADO_NEVERAS REPORTE_ESTADO_NEVERAS_id_temperatura_nevera_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."REPORTE_ESTADO_NEVERAS"
    ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_temperatura_nevera_fkey" FOREIGN KEY (id_temperatura_nevera) REFERENCES public."TEMPERATURA_NEVERA"(id_temperatura_nevera) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: STOCK_NEVERA STOCK_NEVERA_id_nevera_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."STOCK_NEVERA"
    ADD CONSTRAINT "STOCK_NEVERA_id_nevera_fkey" FOREIGN KEY (id_nevera) REFERENCES public."NEVERAS"(id_nevera) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: STOCK_NEVERA STOCK_NEVERA_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."STOCK_NEVERA"
    ADD CONSTRAINT "STOCK_NEVERA_id_producto_fkey" FOREIGN KEY (id_producto) REFERENCES public."PRODUCTOS"(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TIENDAS TIENDAS_id_ciudad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TIENDAS"
    ADD CONSTRAINT "TIENDAS_id_ciudad_fkey" FOREIGN KEY (id_ciudad) REFERENCES public."CIUDAD"(id_ciudad) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TIENDAS TIENDAS_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TIENDAS"
    ADD CONSTRAINT "TIENDAS_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TOKEN_REGISTRO TOKEN_REGISTRO_id_rol_nuevo_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TOKEN_REGISTRO"
    ADD CONSTRAINT "TOKEN_REGISTRO_id_rol_nuevo_usuario_fkey" FOREIGN KEY (id_rol_nuevo_usuario) REFERENCES public."ROLES"(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TOKEN_REGISTRO TOKEN_REGISTRO_id_usuario_creador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TOKEN_REGISTRO"
    ADD CONSTRAINT "TOKEN_REGISTRO_id_usuario_creador_fkey" FOREIGN KEY (id_usuario_creador) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TOKEN_REGISTRO TOKEN_REGISTRO_id_usuario_nuevo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TOKEN_REGISTRO"
    ADD CONSTRAINT "TOKEN_REGISTRO_id_usuario_nuevo_fkey" FOREIGN KEY (id_usuario_nuevo) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TRANSACCIONES TRANSACCIONES_estado_transaccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES"
    ADD CONSTRAINT "TRANSACCIONES_estado_transaccion_fkey" FOREIGN KEY (estado_transaccion) REFERENCES public."ESTADO_TRANSACCION"(id_estado_transaccion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TRANSACCIONES TRANSACCIONES_id_empaque_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES"
    ADD CONSTRAINT "TRANSACCIONES_id_empaque_fkey" FOREIGN KEY (id_empaque) REFERENCES public."EMPAQUES"(id_empaque) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TRANSACCIONES TRANSACCIONES_id_tipo_transaccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES"
    ADD CONSTRAINT "TRANSACCIONES_id_tipo_transaccion_fkey" FOREIGN KEY (id_tipo_transaccion) REFERENCES public."TIPO_TRANSACCION"(id_tipo) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TRANSACCIONES TRANSACCIONES_id_transaccion_rel_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES"
    ADD CONSTRAINT "TRANSACCIONES_id_transaccion_rel_fkey" FOREIGN KEY (id_transaccion_rel) REFERENCES public."TRANSACCIONES"(id_transaccion) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TRANSACCIONES TRANSACCIONES_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TRANSACCIONES"
    ADD CONSTRAINT "TRANSACCIONES_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES public."USUARIOS"(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: USUARIOS USUARIOS_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."USUARIOS"
    ADD CONSTRAINT "USUARIOS_id_rol_fkey" FOREIGN KEY (id_rol) REFERENCES public."ROLES"(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict rSgNpW9cNgPuRM3axdZVK7ZBGdBC7iGJw6SyiAKwjljOh4kmAX65Qhsg1lc1RwQ

