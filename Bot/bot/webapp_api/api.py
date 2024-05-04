import requests
from enum import Enum


class ApiStatus(Enum):
    SUCCESS = 'success'
    ERROR = 'error'


class WebAppApi:
    def __init__(self, base_url):
        self._base_url = base_url

    def new_room(self, tid, room_name):
        payload = {'name': room_name, 'telegramId': tid}
        try:
            headers = {'Content-Type': 'application/json'}
            req_url = f'{self._base_url}/api/rooms/create'
            print(f'Sending POST to {req_url}')
            response = requests.post(req_url, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()
            return {"status": ApiStatus.SUCCESS, "data": data.get('roomLink')}
        except requests.exceptions.RequestException as e:
            print(f'Error creating a new room: {e}')
            return {"status": ApiStatus.ERROR, "data": None}
    
    def admin_rooms(self, tid):
        req_url = f'{self._base_url}/api/users/{tid}/admin-rooms'
        print(f'Sending GET to {req_url}')

        try:
            response = requests.get(req_url, timeout=10)
            response.raise_for_status()

            data = response.json()
            return {"status": ApiStatus.SUCCESS, "data": data}
        except requests.exceptions.RequestException as e:
            print(f'Error fetching admin rooms: {e}')
            return {"status": ApiStatus.ERROR, "data": []}
    
    def user_exists(self, tid):
        req_url = f'{self._base_url}/api/users/{tid}'
        print(f'Sending GET to {req_url}')

        try:
            response = requests.get(req_url, timeout=10)
            response.raise_for_status()

            data = response.json()
            return {"status": ApiStatus.SUCCESS, "exists": data.get('exists', False)}
        except requests.exceptions.RequestException as e:
            print(f'Error checking user existence: {e}')
            return {"status": ApiStatus.ERROR, "exists": False}
    
    def add_user_to_room(self, room_id, telegram_id, role):
        req_url = f'{self._base_url}/api/rooms/{room_id}/add-user'
        print(f'Sending POST to {req_url}')
        
        payload = {'telegramId': telegram_id, 'role': role}
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(req_url, json=payload, headers=headers)
            response.raise_for_status()

            message = response.json().get('message', 'User added successfully')
            return {"status": ApiStatus.SUCCESS, "message": message}
        except requests.exceptions.RequestException as e:
            print(f'Error adding user to room: {e}')
            return {"status": ApiStatus.ERROR, "message": 'Error adding user to room'}
        
    def create_user(self, telegram_id):
        req_url = f'{self._base_url}/api/users/{telegram_id}/create'
        print(f'Sending POST to {req_url}')
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(req_url, headers=headers)
            response.raise_for_status()

            data = response.json()
            return {"status": ApiStatus.SUCCESS, "message": data.get('message', ''), "userId": data.get('userId')}
        except requests.exceptions.RequestException as e:
            print(f'Error creating user: {e}')
            return {"status": ApiStatus.ERROR, "message": 'Error creating user'}