import cv2
import os
import numpy as np
import argparse

# Diccionario de ArUco a usar (debe ser el mismo que en el módulo de la nevera)
# Se usa DICT_4X4_1000 para ser consistente con el módulo de detección.
DICCIONARIO_ARUCO = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_1000)

# Tamaño de la imagen del ArUco en píxeles (el marcador será un cuadrado)
TAMANO_IMAGEN_PX = 300

# Espacio adicional debajo del ArUco para escribir el número de ID
ESPACIO_TEXTO_PX = 50

# --- LÓGICA DE RUTAS ---
# Obtenemos la ruta absoluta del directorio donde se encuentra este script
DIRECTORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
# Creamos la ruta de la carpeta de salida para que esté siempre junto al script
CARPETA_SALIDA = os.path.join(DIRECTORIO_SCRIPT, "arucos_imprimir")

def generar_arucos_bajo_demanda(lista_ids):
    """
    Genera imágenes de marcadores ArUco para una lista de IDs específica.
    """
    print(f"--- Iniciando la generación de marcadores ArUco ---")
    
    # 1. Crear la carpeta de salida si no existe
    if not os.path.exists(CARPETA_SALIDA):
        print(f"Creando carpeta de salida: '{CARPETA_SALIDA}'")
        os.makedirs(CARPETA_SALIDA)

    # 2. Bucle para generar cada marcador solicitado
    for id_marcador in lista_ids:
        # Validamos que el ID sea válido para el diccionario seleccionado (0-999 para DICT_4X4_1000)
        if id_marcador < 0 or id_marcador >= len(DICCIONARIO_ARUCO.bytesList):
            print(f"⚠️  ADVERTENCIA: El ID {id_marcador} está fuera del rango para el diccionario seleccionado. Se omitirá.")
            continue

        nombre_archivo = os.path.join(CARPETA_SALIDA, f"aruco_id_{id_marcador:04d}.png")
        print(f"Generando: {nombre_archivo}")

        # 3. Generar la imagen base del ArUco
        marcador_img = cv2.aruco.generateImageMarker(DICCIONARIO_ARUCO, id_marcador, TAMANO_IMAGEN_PX)

        # 4. Crear un lienzo más grande (blanco) para añadir el texto
        lienzo_alto = TAMANO_IMAGEN_PX + ESPACIO_TEXTO_PX
        lienzo = np.full((lienzo_alto, TAMANO_IMAGEN_PX), 255, dtype=np.uint8)

        # 5. Pegar la imagen del ArUco en la parte superior del lienzo
        lienzo[0:TAMANO_IMAGEN_PX, 0:TAMANO_IMAGEN_PX] = marcador_img

        # 6. Añadir el texto con el ID debajo del ArUco
        texto = f"ID: {id_marcador}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        escala_font = 1.2
        grosor_font = 2
        (ancho_texto, _), _ = cv2.getTextSize(texto, font, escala_font, grosor_font)
        pos_x = (TAMANO_IMAGEN_PX - ancho_texto) // 2
        cv2.putText(lienzo, texto, (pos_x, TAMANO_IMAGEN_PX + 40), font, escala_font, (0, 0, 0), grosor_font, cv2.LINE_AA)

        # 7. Guardar la imagen final
        cv2.imwrite(nombre_archivo, lienzo)

    print("\n--- Proceso completado ---")
    print(f"Se han procesado {len(lista_ids)} IDs y las imágenes están en la carpeta '{CARPETA_SALIDA}'.")

if __name__ == "__main__":
    # Configurar el parser de argumentos para recibir los IDs desde la línea de comandos
    parser = argparse.ArgumentParser(
        description="Generador de etiquetas ArUco bajo demanda.",
        epilog="Ejemplo de uso: python imprimir_arucos.py 5 23 112"
    )
    parser.add_argument('ids', metavar='ID', type=int, nargs='+',
                        help='Uno o más IDs de ArUco para generar (ej: 5 23 112)')
    
    args = parser.parse_args()
    
    # Llamar a la función principal con la lista de IDs proporcionada
    generar_arucos_bajo_demanda(args.ids)