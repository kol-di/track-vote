from aiohttp import ClientSession, ClientTimeout, ClientResponseError, ClientError
from enum import Enum


class ApiStatus(Enum):
    SUCCESS = 'success'
    ERROR = 'error'


class WebAppApi:
    def __init__(self, base_url):
        self._base_url = base_url
        self.session = None


    async def start_session(self):
        if not self.session or self.session.closed:
            self.session = ClientSession(timeout=ClientTimeout(total=10))

    async def close_session(self):
        if self.session and not self.session.closed:
            await self.session.close()

    async def _perform_request(self, method, endpoint, **kwargs):
        await self.start_session()
        req_url = f'{self._base_url}{endpoint}'
        print(f'Sending {method.upper()} to {req_url}')

        try:
            async with self.session.request(method, req_url, **kwargs) as response:
                response.raise_for_status()
                data = await response.json()
                return ApiStatus.SUCCESS, data
        except ClientResponseError as e:
            print(f'Client response error {e.status}: {e.message} while accessing {req_url}')
        except ClientError as e:
            print(f'Error occurred while accessing {req_url}: {str(e)}')

        return ApiStatus.ERROR, {}
    

    async def new_room(self, tid, room_name):
        payload = {'name': room_name, 'telegramId': tid}
        headers = {'Content-Type': 'application/json'}   
        status, data = await self._perform_request("post", "/api/rooms/create", json=payload, headers=headers)
        match status:
            case ApiStatus.SUCCESS:
                return {"status": ApiStatus.SUCCESS, "data": data.get('roomLink')}
            case ApiStatus.ERROR:
                return {"status": ApiStatus.ERROR, "data": None}

    
    async def admin_rooms(self, tid):
        status, data = await self._perform_request("get", f"/api/users/{tid}/admin-rooms")
        match status:
            case ApiStatus.SUCCESS:
                return {"status": ApiStatus.SUCCESS, "data": data}
            case ApiStatus.ERROR:
                return {"status": ApiStatus.ERROR, "data": []}
    
    
    async def user_exists(self, tid):
        status, data = await self._perform_request("get", f"/api/users/{tid}")
        match status:
            case ApiStatus.SUCCESS:
                return {"status": ApiStatus.SUCCESS, "exists": data.get('exists', False)}
            case ApiStatus.ERROR:
                return {"status": ApiStatus.ERROR, "exists": False}
    
    async def add_user_to_room(self, room_id, telegram_id, role):
        payload = {'telegramId': telegram_id, 'role': role}
        headers = {'Content-Type': 'application/json'}
        status, data = await self._perform_request("post", f"/api/rooms/{room_id}/add-user", json=payload, headers=headers)
        match status:
            case ApiStatus.SUCCESS:
                return {"status": ApiStatus.SUCCESS, "message": data.get('message', 'User added successfully')}
            case ApiStatus.ERROR:
                return {"status": ApiStatus.ERROR, "message": "Error adding user to room"}

        
    async def create_user(self, telegram_id):        
        status, data = await self._perform_request("post", f"/api/users/{telegram_id}/create", headers={'Content-Type': 'application/json'})
        match status:
            case ApiStatus.SUCCESS:
                return {"status": ApiStatus.SUCCESS, "message": data.get('message', ''), "userId": data.get('userId')}
            case ApiStatus.ERROR:
                return {"status": ApiStatus.ERROR, "message": 'Error creating user'}
        

    async def room_exists(self, room_id):
        status, data = await self._perform_request("get", f"/api/rooms/{room_id}/exists")
        match status:
            case ApiStatus.SUCCESS:
                return {"status": ApiStatus.SUCCESS, "exists": data.get('exists', False)}
            case ApiStatus.ERROR:
                return {"status": ApiStatus.ERROR, "exists": False}