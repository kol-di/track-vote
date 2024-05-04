from telethon import TelegramClient, events, Button
from telethon.tl import types
from bot.webapp_api.api import WebAppApi
from bot.config import read_config
from bot.utils.encrypt_utils import EncryptManager


config = read_config()
API_ID = config['TELEGRAM']['API_ID']
API_HASH = config['TELEGRAM']['API_HASH']
BOT_TOKEN = config['TELEGRAM']['BOT_TOKEN']
BASE_URL = config['WEBAPP']['BASE_URL']

encrypt_manager = EncryptManager()
webappapi = WebAppApi(BASE_URL)
ADMIN_ROOM_PREFIX = "adminRoom:"



@events.register(events.NewMessage(pattern='/new_room'))
async def create_new_room(event):
    print('Create new room')
    sender = await event.get_sender()
    print(sender.id)
    room_link = webappapi.new_room(sender.id, 'room_uebanov')
    print(room_link)
    room_link_btn = types.KeyboardButtonWebView("Room", room_link)
    await event.respond("Here's your room link:", buttons=[room_link_btn])


@events.register(events.CallbackQuery)
async def handle_inline_button_click(event):
    data = event.data.decode('utf-8')

    # Check if the prefix matches `adminRoom`
    if data.startswith(ADMIN_ROOM_PREFIX):
        try:
            # Remove prefix and split the remaining data into room ID and role
            room_id, role = data[len(ADMIN_ROOM_PREFIX):].split(':')
            # Encrypt the data before sharing in the link
            encrypted_data = encrypt_manager.encrypt_data(f"{room_id}:{role}")
            join_link = f"{BASE_URL}/join_room/{encrypted_data}"
            await event.answer(f"Here's your invite link: {join_link}", alert=True)
        except Exception as e:
            await event.answer(f"Error generating link: {e}", alert=True)


@events.register(events.NewMessage(pattern='/admin_room_link'))
async def send_admin_room_buttons(event):
    sender = await event.get_sender()
    response = webappapi.admin_rooms(sender.id)

    if response['status'] == 'error':
        await event.respond(f"Возникла ошибка")

    elif response['status'] == 'success':
        if not response['data']:
            await event.respond(f"Нет активных комнат, в которых вы администратор")
        else:
            buttons = [
                Button.inline(
                    room['name'],
                    data=f"{ADMIN_ROOM_PREFIX}{room['id']}:admin"
                ) for room in response['data']
            ]
            await event.respond("Для какой комнаты сгенерировать админскую ссылку?", buttons=buttons)


@events.register(events.NewMessage(pattern='/user_room_link'))
async def send_user_room_buttons(event):
    sender = await event.get_sender()
    room_link = webappapi.user_room_link(sender.id, 'room_uebanov')
    await event.respond("Here's a link to join room as admin:", room_link)


@events.register(events.NewMessage(pattern='/start'))
async def start(event):
    params = event.raw_text.split(maxsplit=1)
    if len(params) > 1:
        encoded_data = params[1]
        # Assuming you decode this to get room ID and role
        room_id, role = decode_data(encoded_data)
        link = generate_join_link(room_id, role)
        welcome_message = f"Hello! Click the link below to join as {'an admin' if role == 'admin' else 'a member'}:\n{link}"
        await event.reply(welcome_message)
    else:
        await event.reply("Welcome to the bot! Please use a valid link provided by the application to get started.")


async def start_bot():
    client = TelegramClient('anon', api_id=API_ID, api_hash=API_HASH)
    await client.start(bot_token=BOT_TOKEN)
    print('started')
    for handler in [
        start,
        create_new_room, 
        send_admin_room_buttons, 
        send_user_room_buttons, 
        handle_inline_button_click
    ]:
        client.add_event_handler(handler)
    await client.disconnected