import asyncio
import websockets

async def simple_test():
    try:
        # Basic connection without extra parameters
        async with websockets.connect('ws://127.0.0.1:8001/ws/diagnosis') as ws:
            await ws.send(b'test')
            response = await ws.recv()
            print(f"Server response: {response}")
    except Exception as e:
        print(f"Connection failed: {type(e).__name__}: {str(e)}")

# Old Python compatibility
if hasattr(asyncio, 'run'):
    asyncio.run(simple_test())
else:
    loop = asyncio.get_event_loop()
    loop.run_until_complete(simple_test())
    loop.close()