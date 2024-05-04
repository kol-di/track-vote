from telethon import TelegramClient, events, Button
from telethon.tl import types
from bot.webapp_api.api import WebAppApi, ApiStatus
from bot.config import read_config
from bot.utils.encrypt_utils import EncryptManager


# Configuration
config = read_config()
API_ID = config['TELEGRAM']['API_ID']
API_HASH = config['TELEGRAM']['API_HASH']
BOT_TOKEN = config['TELEGRAM']['BOT_TOKEN']
BOT_USERNAME = config['TELEGRAM']['BOT_USERNAME']
BASE_URL = config['WEBAPP']['BASE_URL']

# Utility and API initialization
encrypt_manager = EncryptManager()
webappapi = WebAppApi(BASE_URL)
ADMIN_ROOM_PREFIX = "adminRoom:"


@events.register(events.NewMessage(pattern='/new_room'))
async def create_new_room(event):
    print('Create new room')
    sender = await event.get_sender()
    print(sender.id)
    response = webappapi.new_room(sender.id, 'room_uebanov')
    
    if response['status'] == ApiStatus.SUCCESS:
        room_link = response['data']
        room_link_btn = types.KeyboardButtonWebView("Room", room_link)
        await event.respond("Here's your room link:", buttons=[room_link_btn])
    else:
        await event.respond("Error creating the room")


@events.register(events.CallbackQuery)
async def handle_inline_button_click(event):
    data = event.data.decode('utf-8')

    if data.startswith(ADMIN_ROOM_PREFIX):
        try:
            room_id, role = data[len(ADMIN_ROOM_PREFIX):].split(':')
            response = webappapi.room_exists(room_id)
            if response['status'] == ApiStatus.SUCCESS:
                if response['exists']:
                    encrypted_data = encrypt_manager.encrypt_data(f"{room_id}:{role}")
                    invite_link = f"https://t.me/{BOT_USERNAME}?start={encrypted_data}"
                    await event.reply(f"**Here's your admin invite link:** [Click here]({invite_link})")
                else:
                    await event.answer("Эта комната больше недоступна", alert=True)
            else:
                await event.answer("Не удалось сгенерировать ссылку-приглашение", alert=True)
        except Exception as e:
            await event.answer(f"Error generating link: {e}", alert=True)


@events.register(events.NewMessage(pattern='/admin_room_link'))
async def send_admin_room_buttons(event):
    sender = await event.get_sender()
    response = webappapi.admin_rooms(sender.id)

    if response['status'] == ApiStatus.ERROR:
        await event.respond(f"Возникла ошибка")
    elif not response['data']:
        await event.respond(f"Нет активных комнат, в которых вы администратор")
    else:
        buttons = [
            Button.inline(
                room['name'],
                data=f"{ADMIN_ROOM_PREFIX}{room['id']}:a"
            ) for room in response['data']
        ]
        buttons_in_row = 2
        buttons = [buttons[i*buttons_in_row:(i+1)*buttons_in_row] for i in range(len(buttons) // 2 + 1)]
        await event.respond("Для какой комнаты сгенерировать админскую ссылку?", buttons=buttons)


@events.register(events.NewMessage(pattern='/user_room_link'))
async def send_user_room_buttons(event):
    sender = await event.get_sender()
    room_link = webappapi.user_room_link(sender.id, 'room_uebanov')
    await event.respond("Here's a link to join room as admin:", room_link)


@events.register(events.NewMessage(pattern='/start'))
async def start(event):
    print('inside start')
    sender = await event.get_sender()
    user_id = sender.id

    user_check = webappapi.user_exists(user_id)

    params = event.raw_text.split(maxsplit=1)

    if len(params) > 1:
        encoded_data = params[1]
        try:
            decrypted_data = encrypt_manager.decrypt_data(encoded_data)
            decrypted_str = decrypted_data.decode('utf-8')
            room_id, role = decrypted_str.split(':')

            # Add the user to the room based on the role
            response = webappapi.add_user_to_room(room_id, user_id, role)

            if response['status'] == ApiStatus.SUCCESS:
                join_link = f"{BASE_URL}/rooms/{room_id}"
                join_link_btn = types.KeyboardButtonWebView("Room", join_link)
                await event.respond("Click the link below to join the room:", buttons=[join_link_btn])
            else:
                await event.reply("Error adding you to the room")

        except Exception as e:
            await event.reply(f"Error decoding the invitation data: {e}")

    else:
        if user_check['status'] == ApiStatus.SUCCESS:
            if not user_check['exists']:
                response = webappapi.create_user(user_id)
                if response['status'] == ApiStatus.SUCCESS:
                    await event.reply("Welcome to the bot! Explore by using the provided commands.")
                else:
                    await event.reply("Ошибка при создании нового пользователя")
            else:
                await event.reply("The bot is already started. Use the available commands to continue.")
        else:
            await event.reply("Ошибка при запуске бота")


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
