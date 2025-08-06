from django.shortcuts import render
import requests
from django.http import JsonResponse
from django.conf import settings
from collections import Counter


def index(request):
    response = requests.get(settings.API_URL)
    posts = response.json()
    total_responses = len(posts)
    unique_emails = len(set(post.get('email') for post in posts if 'email' in post))
    wants_more_info = sum(1 for post in posts if post.get('wantsMoreInfo'))
    unique_sources = len(set(post.get('source') for post in posts if 'source' in post))
    last_timestamp = max((post.get('timestamp', '') for post in posts), default='')

    # Agrupa por fecha (puedes ajustar el formato según tus datos)
    dates = [post.get('timestamp', '')[:10] for post in posts if post.get('timestamp')]
    date_counts = Counter(dates)
    chart_labels = list(date_counts.keys())
    chart_data = list(date_counts.values())

    data = {
        'title': "Landing Page' Dashboard",
        'total_responses': total_responses,
        'unique_emails': unique_emails,
        'wants_more_info': wants_more_info,
        'unique_sources': unique_sources,
        'last_timestamp': last_timestamp,
        'posts': posts,
        'chart_labels': chart_labels,
        'chart_data': chart_data,
    }
    return render(request, 'dashboard/index.html', data)
