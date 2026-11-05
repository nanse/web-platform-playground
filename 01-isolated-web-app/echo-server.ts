// Direct Sockets 실습용 TCP 에코 서버: 받은 바이트를 그대로 돌려보내요.
import { createServer } from 'node:net'

createServer((socket) => socket.on('error', console.error).pipe(socket)).listen(7777, '127.0.0.1', () =>
  console.log('TCP 에코 서버를 켰어요 (127.0.0.1:7777). 앱에서 "TCP로 보내기"를 눌러 봐요.'),
)
