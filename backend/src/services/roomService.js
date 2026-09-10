const rooms = new Map();

function createRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createUniqueRoomId() {
  let roomId = createRoomId();

  while (rooms.has(roomId)) {
    roomId = createRoomId();
  }

  return roomId;
}

export function createTeacherRoom(teacherSocketId) {
  const roomId = createUniqueRoomId();

  rooms.set(roomId, {
    teacher: teacherSocketId,
    student: null,
  });

  return roomId;
}

export function joinStudentRoom(roomId, studentSocketId) {
  const room = rooms.get(roomId);

  if (!room) {
    return {
      error: "Room is either not in session or does not exist.",
    };
  }

  if (room.student) {
    return {
      error: "Room already has a student.",
    };
  }

  room.student = studentSocketId;

  return {
    room,
  };
}

export function removeUserFromRoom(roomId, role) {
  const room = rooms.get(roomId);

  if (!room) {
    return;
  }

  if (role === "teacher") {
    rooms.delete(roomId);
    return;
  }

  if (role === "student") {
    room.student = null;
  }
}

// export { createTeacherRoom, joinStudentRoom, removeUserFromRoom };
