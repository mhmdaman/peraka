import { useEffect, useState, useRef } from 'react'
import { Send, User as UserIcon } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

interface Message {
  senderId: number
  receiverId: number
  message: string
  createdAt: string
}

interface User {
  id: number
  first_name: string
  last_name: string
  avatar: string | null
  job_title: string
  online?: boolean
}

export default function Chat() {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch all employees for contact list
    api.get('/employees').then(res => {
      setUsers(res.data.data.filter((u: User) => u.id !== user?.id))
    }).catch(console.error)

    // Connect socket
    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001', {
      withCredentials: true
    })

    s.on('connect', () => {
      s.emit('join', user?.id)
    })

    s.on('online_users', (usersList: string[]) => {
      setOnlineUsers(usersList)
    })

    s.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })

    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim() || !selectedUser || !socket) return

    socket.emit('send_message', {
      senderId: user?.id,
      receiverId: selectedUser.id,
      message: inputMsg
    })

    setInputMsg('')
  }

  // Filter messages for current chat
  const chatMessages = messages.filter(m => 
    (m.senderId === user?.id && m.receiverId === selectedUser?.id) ||
    (m.senderId === selectedUser?.id && m.receiverId === user?.id)
  )

  return (
    <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', gap: '1.5rem' }}>
      {/* Contact List */}
      <div className="card" style={{ width: 320, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Contacts</h2>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {users.map(u => (
            <div 
              key={u.id} 
              onClick={() => setSelectedUser(u)}
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                cursor: 'pointer',
                background: selectedUser?.id === u.id ? 'var(--bg-surface)' : 'transparent',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {u.avatar ? <img src={u.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={20} color="var(--text-muted)" />}
                </div>
                {onlineUsers.includes(String(u.id)) && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-card)' }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.job_title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedUser.avatar ? <img src={selectedUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={20} color="var(--text-muted)" />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedUser.first_name} {selectedUser.last_name}</h3>
                <p style={{ fontSize: '0.75rem', color: onlineUsers.includes(String(selectedUser.id)) ? '#10b981' : 'var(--text-secondary)' }}>
                  {onlineUsers.includes(String(selectedUser.id)) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatMessages.map((msg, i) => {
                const isMe = msg.senderId === user?.id
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '70%', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '1rem',
                      background: isMe ? 'var(--accent)' : 'var(--bg-surface)',
                      color: isMe ? 'white' : 'var(--text-primary)',
                      borderBottomRightRadius: isMe ? '0.25rem' : '1rem',
                      borderBottomLeftRadius: !isMe ? '0.25rem' : '1rem'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.5 }}>{msg.message}</p>
                      <span style={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '0.25rem' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field"
                  style={{ flex: 1, margin: 0 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!inputMsg.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={40} color="var(--border)" />
            </div>
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
