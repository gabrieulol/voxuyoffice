import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../lib/constants'

export default function AuthScreen({ onAuth }) {
  const [step, setStep] = useState('login') // login | check_email | setup_name
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      // Sign up with email + password
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email.split('@')[0] } }
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (data.user) {
        // Auto-confirmed or email confirmation not required
        if (data.session) {
          onAuth(data.user)
        } else {
          setStep('check_email')
        }
      }
    } else {
      // Sign in with email + password
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (data.user) {
        onAuth(data.user)
      }
    }
    setLoading(false)
  }

  const font = "'JetBrains Mono', monospace"

  if (step === 'check_email') {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: font }}>
        <div style={{ width: 400, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ color: T.text, fontSize: 18, marginBottom: 8 }}>Verifique seu email</h2>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.6 }}>
            Enviamos um link de confirmação para <span style={{ color: T.accent }}>{email}</span>.
            Clique no link para ativar sua conta.
          </p>
          <button onClick={() => { setStep('login'); setIsSignUp(false) }} style={{ marginTop: 24, padding: '10px 24px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: font }}>
            Voltar ao login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{ width: 420, background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg,${T.accent},#00b37e)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: T.bg, marginBottom: 16 }}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 6 }}>Stone HQ</h1>
          <p style={{ fontSize: 11, color: T.textMuted }}>Escritório virtual do time</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isSignUp && (
            <div>
              <label style={{ fontSize: 10, color: T.textDim, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>SEU NOME</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Como o time te conhece"
                required={isSignUp}
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, fontSize: 13, fontFamily: font, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 10, color: T.textDim, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="voce@stone.com.br"
              required
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, fontSize: 13, fontFamily: font, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: T.textDim, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>SENHA</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? "Crie uma senha (min. 6 chars)" : "Sua senha"}
              required
              minLength={6}
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, fontSize: 13, fontFamily: font, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: `${T.danger}15`, border: `1px solid ${T.danger}33`, color: T.danger, fontSize: 11 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: loading ? T.borderLight : `linear-gradient(135deg,${T.accent},#00b37e)`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: font, marginTop: 4 }}
          >
            {loading ? '...' : isSignUp ? '🚀 Criar conta e entrar' : '🔓 Entrar'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              style={{ background: 'none', border: 'none', color: T.accent, fontSize: 11, cursor: 'pointer', fontFamily: font }}
            >
              {isSignUp ? 'Já tem conta? Fazer login' : 'Primeira vez? Criar conta'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '12px 32px 20px', textAlign: 'center', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.textDim }}>
            <span style={{ color: T.accent }}>WASD</span> mover · <span style={{ color: T.accent }}>E</span> interagir · <span style={{ color: T.accent }}>R</span> reagir
          </div>
        </div>
      </div>
    </div>
  )
}
