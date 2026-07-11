import { useEffect, useState, useRef } from 'react'
import { Send, User as UserIcon, Lock } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  encryptMessage,
  decryptMessage
} from '../lib/crypto'

interface Message {
  senderId: number
  receiverId: number
  message: string
  createdAt: string
  id?: number
}

interface User {
  id: number
  first_name: string
  last_name: string
  avatar: string | null
  job_title: string
  public_key?: string
}

export default function Chat() {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null)
  const [myPublicKey, setMyPublicKey] = useState<CryptoKey | null>(null)
  const [receiverPublicKey, setReceiverPublicKey] = useState<CryptoKey | null>(null)
  
  const [messages, setMessages] = useState<(Message & { text: string })[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialization: Keys & Socket
  useEffect(() => {
    if (!user) return

    const initKeys = async () => {
      try {
        let privKeyPem = localStorage.getItem(`chat_priv_key_${user.id}`)
        let pubKeyPem = localStorage.getItem(`chat_pub_key_${user.id}`)

        if (!privKeyPem || !pubKeyPem) {
          console.log('Generating new E2E keys...')
          const keyPair = await generateKeyPair()
          privKeyPem = await exportPrivateKey(keyPair.privateKey)
          pubKeyPem = await exportPublicKey(keyPair.publicKey)
          
          // Upload to server FIRST
          await api.post('/employees/public-key', { public_key: pubKeyPem })

          localStorage.setItem(`chat_priv_key_${user.id}`, privKeyPem)
          localStorage.setItem(`chat_pub_key_${user.id}`, pubKeyPem)
        }

        const privKey = await importPrivateKey(privKeyPem)
        const pubKey = await importPublicKey(pubKeyPem)
        setMyPrivateKey(privKey)
        setMyPublicKey(pubKey)
      } catch (err) {
        console.error('Error initializing keys:', err)
      }
    }
    
    initKeys()

    api.get('/employees').then(res => {
      setUsers(res.data.data.filter((u: User) => u.id !== user.id))
    }).catch(console.error)

    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001', {
      withCredentials: true
    })

    s.on('connect', () => {
      s.emit('join', user.id)
    })

    s.on('online_users', (usersList: string[]) => {
      setOnlineUsers(usersList)
    })

    s.on('receive_message', async (msg: Message) => {
      // Handle incoming real-time message
      let decryptedText = '[Encrypted]'
      try {
        // Wait for private key to be available if it's not in state yet
        const privKeyPem = localStorage.getItem(`chat_priv_key_${user.id}`)
        if (privKeyPem) {
          const privKey = await importPrivateKey(privKeyPem)
          try {
            const parsed = JSON.parse(msg.message)
            const cipher = msg.senderId === user.id ? parsed.sender : parsed.receiver
            decryptedText = await decryptMessage(privKey, cipher)
          } catch {
            decryptedText = msg.message // fallback if not JSON
          }
        }
      } catch (e) {
        console.error('Real-time decryption failed', e)
      }
      
      setMessages(prev => {
        // prevent duplicate echoes
        if (prev.some(m => m.createdAt === msg.createdAt && m.senderId === msg.senderId)) return prev
        return [...prev, { ...msg, text: decryptedText }]
      })
    })

    setSocket(s)
    return () => { s.disconnect() }
  }, [user])

  // Fetch history when user selected
  useEffect(() => {
    if (!selectedUser || !user || !myPrivateKey) return

    const loadChat = async () => {
      setLoadingHistory(true)
      try {
        // Fetch receiver's public key
        const pubKeyRes = await api.get(`/employees/${selectedUser.id}/public-key`)
        if (pubKeyRes.data.public_key) {
          const recKey = await importPublicKey(pubKeyRes.data.public_key)
          setReceiverPublicKey(recKey)
        } else {
          setReceiverPublicKey(null)
        }

        // Fetch history
        const histRes = await api.get(`/chat/${selectedUser.id}`)
        const histMessages: Message[] = histRes.data.data

        // Decrypt history
        const decryptedMessages = await Promise.all(histMessages.map(async (msg) => {
          let text = '[Encrypted]'
          try {
            const parsed = JSON.parse(msg.message)
            const cipher = msg.senderId === user.id ? parsed.sender : parsed.receiver
            text = await decryptMessage(myPrivateKey, cipher)
          } catch {
            text = msg.message // plain text fallback
          }
          return { ...msg, senderId: msg.senderId || (msg as any).sender_id, receiverId: msg.receiverId || (msg as any).receiver_id, createdAt: msg.createdAt || (msg as any).created_at, text }
        }))

        setMessages(decryptedMessages)
      } catch (err) {
        console.error('Failed to load chat history', err)
        setMessages([])
      } finally {
        setLoadingHistory(false)
      }
    }
    
    loadChat()
  }, [selectedUser, user, myPrivateKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim() || !selectedUser || !socket || !myPublicKey) return

    if (!receiverPublicKey) {
      alert("This user hasn't set up encrypted chat yet (no public key).")
      return
    }

    const plaintext = inputMsg
    setInputMsg('')

    try {
      // Encrypt for receiver
      const encReceiver = await encryptMessage(receiverPublicKey, plaintext)
      // Encrypt for self
      const encSender = await encryptMessage(myPublicKey, plaintext)
      
      const payload = JSON.stringify({ sender: encSender, receiver: encReceiver })

      // Optimistic UI update
      const msgObj = {
        senderId: user!.id,
        receiverId: selectedUser.id,
        message: payload,
        createdAt: new Date().toISOString(),
        text: plaintext
      }
      setMessages(prev => [...prev, msgObj])

      socket.emit('send_message', {
        senderId: user!.id,
        receiverId: selectedUser.id,
        message: payload
      })
    } catch (err) {
      console.error('Encryption failed', err)
      alert("Failed to encrypt message.")
    }
  }

  const currentChat = messages.filter(m => 
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
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.75rem', borderRadius: 20 }}>
                <Lock size={12} /> E2E Encrypted
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading messages...</div>
              ) : currentChat.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 'auto', marginBottom: 'auto' }}>
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                currentChat.map((msg, i) => {
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
                        <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                        <span style={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '0.25rem' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
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
                  disabled={!receiverPublicKey}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !inputMsg.trim() || !receiverPublicKey ? 0.5 : 1 }} disabled={!inputMsg.trim() || !receiverPublicKey}>
                  <Send size={18} />
                </button>
              </form>
              {!receiverPublicKey && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.5rem 0 0 0' }}>Cannot send messages: Contact has no public key.</p>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={40} color="var(--border)" />
            </div>
            <p>Select a contact to start an end-to-end encrypted chat</p>
          </div>
        )}
      </div>
    </div>
  )
}
