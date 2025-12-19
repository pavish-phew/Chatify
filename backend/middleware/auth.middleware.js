import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// For Socket.IO
export const socketAuth = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.cookie) {
      const cookies = socket.handshake.headers.cookie
        .split(';')
        .map((c) => c.trim().split('='))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      token = cookies.accessToken;
    }

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.userId;
    socket.userName = decoded.name;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
};


