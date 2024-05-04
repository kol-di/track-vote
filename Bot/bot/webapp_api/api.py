import requests


class WebAppApi:
    def __init__(self, base_url):
        self._base_url = base_url

    def new_room(self, tid, room_name):
        payload = {'name': room_name, 'telegramId': tid}
        try:
            headers={'Content-Type': 'application/json'}
            req_url = f'{self._base_url}/api/rooms/create'
            print('Sending POST to ' + req_url)
            response = requests.post(req_url, json=payload, headers=headers)
        except requests.exceptions.RequestException as e:
            print(f'Error code {response.status_code}; Error: {e}')

        return response.json()['roomLink']
    
    def admin_rooms(self, tid):
            req_url = f'{self._base_url}/api/users/{tid}/admin-rooms'
            print(f'Sending GET to {req_url}')

            try:
                response = requests.get(req_url, timeout=10)  # Specify a timeout for the request
                response.raise_for_status()  # Raises an exception for 4xx/5xx errors

                # Attempt to parse JSON response
                try:
                    data = response.json()
                    return {"status": "success", "data": data}

                except ValueError:
                    print("Invalid JSON response")
                    return {"status": "error", "data": []}

            except requests.exceptions.HTTPError as http_err:
                print(f'HTTP error occurred: {http_err}')

            except requests.exceptions.ConnectionError:
                print("Connection error occurred")

            except requests.exceptions.Timeout:
                print("Request timed out")

            except requests.exceptions.RequestException as req_err:
                print(f'An error occurred: {req_err}')
            
            return {"status": "error", "data": []}