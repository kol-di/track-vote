import requests


class WebAppApi:
    def __init__(self, base_url):
        self._base_url = base_url

    def new_room(self, tid, room_name):
        payload = {'name': room_name, 'telegramId': tid}
        try:
            headers={'Content-Type': 'application/json'}
            print('Sending POST to ' + f'{self._base_url}/api/rooms/create')
            response = requests.post(f'{self._base_url}/api/rooms/create', json=payload, headers=headers)
        except requests.exceptions.RequestException as e:
            print(f'Error code {response.status_code}; Error: {e}')

        return response.json()['roomLink']