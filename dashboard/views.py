from django.shortcuts import render
import requests
from django.conf import settings
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required

@login_required
@permission_required('dashboard.index_viewer', raise_exception=True)
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
    
    # Nombres distintos
    nombres = [post.get('nombre', '') for post in posts if post.get('nombre')]
    unique_names = len(set(filter(None, nombres)))  # Filtrar nombres vacíos
    
    # Usuarios que quieren más información (basado en motivo)
    # Contar los que tienen motivo 'consulta' o que quieren 'cotización'
    wants_more_info = sum(1 for post in posts 
                         if post.get('motivo', '').lower() in ['consulta', 'cotización', 'cotizacion'])
    
    # Tipos de motivos distintos
    motivos = [post.get('motivo', '') for post in posts if post.get('motivo')]
    unique_motivos = len(set(filter(None, motivos)))  # Filtrar motivos vacíos
    
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
    
    # Preparar datos para el gráfico - Respuestas por día
    print("=== PREPARANDO DATOS DEL GRÁFICO ===")
    
    # Agrupar respuestas por fecha
    responses_by_date = defaultdict(int)
    
    for post in posts:
        timestamp = post.get('timestamp') or post.get('fecha', '')
        if timestamp:
            try:
                # Si tiene formato 'dd/mm/yyyy, hh:mm:ss p. m.'
                if '/' in timestamp and ('p. m.' in timestamp or 'a. m.' in timestamp):
                    # Extraer solo la fecha (parte antes de la coma)
                    date_part = timestamp.split(',')[0].strip()
                    responses_by_date[date_part] += 1
                    print(f"Procesado timestamp formato dd/mm/yyyy: {timestamp} -> {date_part}")
                # Si tiene formato ISO 'yyyy-mm-ddThh:mm:ss.fffZ'
                elif 'T' in timestamp:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    date_str = dt.strftime('%d/%m/%Y')
                    responses_by_date[date_str] += 1
                    print(f"Procesado timestamp formato ISO: {timestamp} -> {date_str}")
                # Si tiene formato 'yyyy-mm-dd hh:mm:ss'
                elif '-' in timestamp and ' ' in timestamp and timestamp.count('-') == 2:
                    dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                    date_str = dt.strftime('%d/%m/%Y')
                    responses_by_date[date_str] += 1
                    print(f"Procesado timestamp formato yyyy-mm-dd: {timestamp} -> {date_str}")
                # Si tiene formato 'yyyy-mm-dd' (solo fecha)
                elif '-' in timestamp and timestamp.count('-') == 2 and ' ' not in timestamp:
                    dt = datetime.strptime(timestamp, '%Y-%m-%d')
                    date_str = dt.strftime('%d/%m/%Y')
                    responses_by_date[date_str] += 1
                    print(f"Procesado timestamp formato yyyy-mm-dd (solo fecha): {timestamp} -> {date_str}")
                else:
                    print(f"Formato de timestamp no reconocido: {timestamp}")
            except Exception as e:
                print(f"Error procesando timestamp {timestamp}: {e}")
                continue
    
    print(f"Respuestas agrupadas por fecha: {dict(responses_by_date)}")
    
    # Convertir a listas ordenadas para el gráfico
    if responses_by_date:
        try:
            # Ordenar fechas
            sorted_dates = sorted(responses_by_date.keys(), 
                                key=lambda x: datetime.strptime(x, '%d/%m/%Y'))
            chart_labels = sorted_dates
            chart_data = [responses_by_date[date] for date in sorted_dates]
            
            print(f"Datos del gráfico preparados:")
            print(f"Labels: {chart_labels}")
            print(f"Data: {chart_data}")
            
        except Exception as e:
            print(f"Error ordenando fechas: {e}")
            # En caso de error, usar datos sin ordenar
            chart_labels = list(responses_by_date.keys())
            chart_data = list(responses_by_date.values())
            print(f"Usando datos sin ordenar: labels={chart_labels}, data={chart_data}")
    else:
        # Datos por defecto si no hay datos
        print("No hay datos para el gráfico, usando valores por defecto")
        chart_labels = ['Sin datos']
        chart_data = [0]
    
    # Crear el contexto completo
    data = {
        'title': "Landing Page Dashboard",
        'total_responses': total_responses,
        'unique_emails': unique_names,  # Reutilizamos este campo para nombres únicos
        'wants_more_info': wants_more_info,
        'unique_sources': unique_motivos,  # Reutilizamos este campo para motivos únicos
        'last_timestamp': last_timestamp,
        'posts': posts,
        'chart_labels': chart_labels,
        'chart_data': chart_data,
    }
    
    print(f"=== RESUMEN FINAL ===")
    print(f"Datos calculados - Total: {total_responses}, Nombres únicos: {unique_names}, Quieren info: {wants_more_info}, Motivos únicos: {unique_motivos}")
    print(f"Contexto final del gráfico: labels={len(chart_labels)}, data={len(chart_data)}")
    print(f"Chart labels: {chart_labels}")
    print(f"Chart data: {chart_data}")

    return render(request, 'dashboard/index.html', data)