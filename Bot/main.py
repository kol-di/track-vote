from bot.bot import start_bot, exit_bot
import asyncio


async def main():
    task = asyncio.create_task(start_bot())
    try:
        await task
    except (KeyboardInterrupt, SystemExit, asyncio.exceptions.CancelledError) as e:
        print('Program terminating due to:', type(e).__name__)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        print('Program terminated')
    finally:
        await exit_bot()
        print('Client and session closed')


if __name__ == '__main__':
    asyncio.run(main())
