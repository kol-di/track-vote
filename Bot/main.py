from bot.bot import start_bot
import asyncio


async def main():
    await start_bot()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit, asyncio.exceptions.CancelledError):
        print('Program terminated')