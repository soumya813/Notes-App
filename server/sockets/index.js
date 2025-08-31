const { Server } = require('socket.io');
const Note = require('../models/Notes');

// Simple in-memory presence/state; for production, consider Redis adapter
const noteRooms = new Map(); // noteId -> { users: Map<socketId, { id, name, color }>, lastBody: string }

function colorForUser(userId) {
  const colors = ['#e6194b','#3cb44b','#ffe119','#0082c8','#f58231','#911eb4','#46f0f0','#f032e6','#d2f53c','#fabebe','#008080','#e6beff','#aa6e28','#fffac8','#800000','#aaffc3','#808080','#ffd8b1','#000080','#808000'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

exports.initSockets = ({ server, sessionMiddleware, passport }) => {
  const io = new Server(server, {
    cors: { origin: true, credentials: true }
  });

  // Share session and passport with Socket.IO
  io.engine.use((req, res, next) => sessionMiddleware(req, res, next));
  io.engine.use((req, res, next) => passport.initialize()(req, res, next));
  io.engine.use((req, res, next) => passport.session()(req, res, next));

  io.on('connection', (socket) => {
    const req = socket.request;
    const user = req.user;

    // Reject unauthenticated sockets
    if (!user) {
      socket.emit('auth:error', 'Unauthenticated');
      socket.disconnect(true);
      return;
    }

    socket.on('note:join', async ({ noteId }) => {
      if (!noteId) return;
      try {
        // Access check: owner or collaborator
        const note = await Note.findOne({ _id: noteId, $or: [{ user: user.id }, { collaborators: user.id }] }).lean();
        if (!note) {
          socket.emit('note:error', 'Note not found or access denied');
          return;
        }
        // If not owner, require collaboration enabled
        const isOwner = String(note.user) === String(user.id);
        if (!isOwner && !note.isCollabEnabled) {
          socket.emit('note:error', 'Collaboration is disabled by owner');
          return;
        }

        socket.join(noteId);
        let room = noteRooms.get(noteId);
        if (!room) {
          room = { users: new Map(), lastBody: note.body };
          noteRooms.set(noteId, room);
        }

        const userInfo = { id: user.id, name: user.firstName || 'User', color: colorForUser(user.id) };
        room.users.set(socket.id, userInfo);

        // Send current state to the new client
        socket.emit('note:state', { body: room.lastBody || '', users: Array.from(room.users.values()) });
        // Notify others about presence
        socket.to(noteId).emit('presence:join', userInfo);
      } catch (e) {
        socket.emit('note:error', 'Failed to join note');
      }
    });

    socket.on('note:leave', ({ noteId }) => {
      if (!noteId) return;
      socket.leave(noteId);
      const room = noteRooms.get(noteId);
      if (room && room.users.has(socket.id)) {
        const info = room.users.get(socket.id);
        room.users.delete(socket.id);
        socket.to(noteId).emit('presence:leave', info);
      }
    });

    // Broadcast typing indicator
    socket.on('note:typing', ({ noteId, typing }) => {
      if (!noteId) return;
      socket.to(noteId).emit('presence:typing', { userId: user.id, typing: !!typing });
    });

    // Naive collaborative editing: last-writer-wins with basic throttling
    let lastUpdate = 0;
    socket.on('note:update', async ({ noteId, body }) => {
      if (!noteId || typeof body !== 'string') return;
      const now = Date.now();
      if (now - lastUpdate < 100) return; // throttle 10 updates/sec per socket
      lastUpdate = now;

      // Verify access on each update (in case collaboration disabled or access revoked)
      const note = await Note.findOne({ _id: noteId, $or: [{ user: user.id }, { collaborators: user.id }] }).select('user isCollabEnabled').lean();
      if (!note) return; // silently ignore
      const isOwner = String(note.user) === String(user.id);
      if (!isOwner && !note.isCollabEnabled) return;

      const room = noteRooms.get(noteId);
      if (!room) return;
      room.lastBody = body;
      socket.to(noteId).emit('note:patch', { body, userId: user.id });
    });

    // Persist on explicit save
  socket.on('note:save', async ({ noteId, body, title }) => {
      if (!noteId || typeof body !== 'string') return;
      try {
    // Verify access again before persisting
    const note = await Note.findOne({ _id: noteId, $or: [{ user: user.id }, { collaborators: user.id }] }).select('user isCollabEnabled').lean();
    if (!note) return;
    const isOwner = String(note.user) === String(user.id);
    if (!isOwner && !note.isCollabEnabled) return;

        const update = { body };
        if (typeof title === 'string' && title.trim()) update.title = title.trim();
        await Note.updateOne({ _id: noteId, user: user.id }, { $set: update });
        socket.emit('note:saved');
        socket.to(noteId).emit('note:saved:by', { userId: user.id });
      } catch {
        socket.emit('note:error', 'Failed to save');
      }
    });

    socket.on('disconnecting', () => {
      for (const noteId of socket.rooms) {
        if (noteRooms.has(noteId)) {
          const room = noteRooms.get(noteId);
          const info = room.users.get(socket.id);
          if (info) socket.to(noteId).emit('presence:leave', info);
          room.users.delete(socket.id);
        }
      }
    });
  });
};
