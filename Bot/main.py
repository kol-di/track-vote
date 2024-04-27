from bot.bot import start_bot
import asyncio



async def main():
    await start_bot()


if __name__ == '__main__':
    asyncio.run(main())