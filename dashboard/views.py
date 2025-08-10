from django.shortcuts import render
import requests
from django.conf import settings
from collections import Counter
from datetime import datetime

def index(request):
    try:
        # Consumir tu API de PythonAnywhere
        api_url = settings.API_URL
        print(f"=== DEBUGGING API ===")
        print(f"Intentando conectar a: {api_url}")
        
        response = requests.get(api_url, timeout=30)
        print(f"Status code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        response.raise_for_status()
        
        # Intentar obtener el contenido como texto primero
        content_text = response.text
        print(f"Contenido crudo (primeros 500 chars): {content_text[:500]}")
        
        posts = response.json()
        
        print(f"Tipo de respuesta JSON: {type(posts)}")
        print(f"Contenido completo: {posts}")
        
        # Verificar que posts sea una lista
        if not isinstance(posts, list):
            print("La API no devolvió una lista, estructura recibida:")
            if isinstance(posts, dict):
                print(f"Claves disponibles: {list(posts.keys())}")
                # Intentar diferentes estructuras comunes
                if 'data' in posts:
                    posts = posts['data']
                    print(f"Usando posts['data']: {posts}")
                elif 'results' in posts:
                    posts = posts['results']
                    print(f"Usando posts['results']: {posts}")
                elif 'response' in posts:
                    posts = posts['response']
                    print(f"Usando posts['response']: {posts}")
                else:
                    # AQUÍ ESTÁ LA SOLUCIÓN: Convertir el dict a lista
                    print("Convirtiendo diccionario a lista de valores")
                    posts = list(posts.values())
                    print(f"Posts convertidos: {len(posts)} elementos")
            else:
                posts = []
        
        print(f"Posts finales: {posts}")
        print(f"Cantidad de posts: {len(posts)}")
                
    except requests.RequestException as e:
        print(f"ERROR DE RED: {e}")
        print(f"Tipo de error: {type(e)}")
        posts = []
    except Exception as e:
        print(f"ERROR INESPERADO: {e}")
        print(f"Tipo de error: {type(e)}")
        import traceback
        traceback.print_exc()
        posts = []
    
    # Calcular indicadores ajustados a tu estructura de datos
    total_responses = len(posts)
    
    # Nombres únicos (ya que no tienes email, usamos nombre como identificador)
    nombres = [post.get('nombre', '') for post in posts if post.get('nombre')]
    unique_names = len(set(filter(None, nombres)))  # Filtrar nombres vacíos
    
    # Usuarios que quieren más información (basado en motivo)
    # Contar los que tienen motivo 'consulta' o que quieren 'cotización'
    wants_more_info = sum(1 for post in posts 
                         if post.get('motivo', '').lower() in ['consulta', 'cotización', 'cotizacion'])
    
    # Tipos de motivos únicos (fuentes distintas)
    motivos = [post.get('motivo', '') for post in posts if post.get('motivo')]
    unique_motivos = len(set(filter(None, motivos)))  # Filtrar motivos vacíos
    
    # Última respuesta (timestamp más reciente)
    # Buscar en 'timestamp' primero, luego en 'fecha'
    timestamps = []
    for post in posts:
        if post.get('timestamp'):
            timestamps.append(post.get('timestamp'))
        elif post.get('fecha'):
            timestamps.append(post.get('fecha'))
    
    last_timestamp = max(timestamps) if timestamps else "N/A"
    
    # Formatear timestamp
    if last_timestamp != "N/A":
        try:
            # Si contiene 'T' es formato ISO
            if 'T' in last_timestamp:
                dt = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
                last_timestamp = dt.strftime('%d/%m/%Y %H:%M')
            # Si ya está en formato dd/mm/yyyy, dejarlo como está
            elif '/' in last_timestamp and ('p. m.' in last_timestamp or 'a. m.' in last_timestamp):
                # Ya está formateado, mantenerlo
                pass
            else:
                # Otros formatos
                dt = datetime.strptime(last_timestamp, '%Y-%m-%d %H:%M:%S')
                last_timestamp = dt.strftime('%d/%m/%Y %H:%M')
        except Exception as e:
            print(f"Error al formatear timestamp {last_timestamp}: {e}")
            # Dejar el timestamp como viene
    
    data = {
        'title': "Landing Page Dashboard",
        'total_responses': total_responses,
        'unique_emails': unique_names,  # Reutilizamos este campo para nombres únicos
        'wants_more_info': wants_more_info,
        'unique_sources': unique_motivos,  # Reutilizamos este campo para motivos únicos
        'last_timestamp': last_timestamp,
        'posts': posts,
    }
    
    print(f"Datos calculados - Total: {total_responses}, Nombres únicos: {unique_names}, Quieren info: {wants_more_info}, Motivos únicos: {unique_motivos}")
    
    return render(request, 'dashboard/index.html', data)