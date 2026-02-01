import { useState, useEffect, useRef } from 'react'
import { T } from '../lib/constants'

// ═══════════════════════════════════════════
// DeviceSettings — Audio/Video device selector
// ═══════════════════════════════════════════

export default function DeviceSettings({
    isOpen,
    onClose,
    onDeviceChange,
    currentAudioInput,
    currentAudioOutput,
    currentVideoInput,
}) {
    const [devices, setDevices] = useState({ audioInputs: [], audioOutputs: [], videoInputs: [] })
    const [selectedAudioInput, setSelectedAudioInput] = useState(currentAudioInput || '')
    const [selectedAudioOutput, setSelectedAudioOutput] = useState(currentAudioOutput || '')
    const [selectedVideoInput, setSelectedVideoInput] = useState(currentVideoInput || '')
    const [previewStream, setPreviewStream] = useState(null)
    const videoRef = useRef(null)
    const font = "'JetBrains Mono', monospace"

    // Load devices on mount
    useEffect(() => {
        if (!isOpen) return
        loadDevices()
        return () => {
            // Cleanup preview stream
            if (previewStream) {
                previewStream.getTracks().forEach(t => t.stop())
            }
        }
    }, [isOpen])

    // Update preview when video device changes
    useEffect(() => {
        if (!isOpen || !selectedVideoInput) return
        startVideoPreview()
    }, [selectedVideoInput, isOpen])

    const loadDevices = async () => {
        try {
            // Request permission first to get device labels
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            const allDevices = await navigator.mediaDevices.enumerateDevices()

            const audioInputs = allDevices.filter(d => d.kind === 'audioinput')
            const audioOutputs = allDevices.filter(d => d.kind === 'audiooutput')
            const videoInputs = allDevices.filter(d => d.kind === 'videoinput')

            setDevices({ audioInputs, audioOutputs, videoInputs })

            // Set defaults if not set
            if (!selectedAudioInput && audioInputs.length) setSelectedAudioInput(audioInputs[0].deviceId)
            if (!selectedAudioOutput && audioOutputs.length) setSelectedAudioOutput(audioOutputs[0].deviceId)
            if (!selectedVideoInput && videoInputs.length) setSelectedVideoInput(videoInputs[0].deviceId)
        } catch (e) {
            console.warn('Could not enumerate devices:', e)
        }
    }

    const startVideoPreview = async () => {
        try {
            if (previewStream) {
                previewStream.getTracks().forEach(t => t.stop())
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: selectedVideoInput ? { exact: selectedVideoInput } : undefined },
                audio: false,
            })
            setPreviewStream(stream)
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (e) {
            console.warn('Could not start video preview:', e)
        }
    }

    const handleSave = () => {
        if (previewStream) {
            previewStream.getTracks().forEach(t => t.stop())
        }
        onDeviceChange({
            audioInput: selectedAudioInput,
            audioOutput: selectedAudioOutput,
            videoInput: selectedVideoInput,
        })
        onClose()
    }

    const handleClose = () => {
        if (previewStream) {
            previewStream.getTracks().forEach(t => t.stop())
        }
        onClose()
    }

    if (!isOpen) return null

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ width: 420, maxHeight: '90vh', overflowY: 'auto', background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: font }}>⚙️ Configurações de Dispositivos</span>
                    <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Video Preview */}
                    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#111', aspectRatio: '16/9', position: 'relative' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                        {!previewStream && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim, fontSize: 12, fontFamily: font }}>
                                📷 Preview da câmera
                            </div>
                        )}
                    </div>

                    {/* Camera Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 8, fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📷 Câmera
                        </label>
                        <select
                            value={selectedVideoInput}
                            onChange={e => setSelectedVideoInput(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 10,
                                border: `1px solid ${T.border}`, background: T.bg, color: T.text,
                                fontSize: 12, fontFamily: font, cursor: 'pointer', outline: 'none',
                            }}
                        >
                            {devices.videoInputs.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Câmera ${devices.videoInputs.indexOf(d) + 1}`}</option>
                            ))}
                        </select>
                    </div>

                    {/* Microphone Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 8, fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🎤 Microfone
                        </label>
                        <select
                            value={selectedAudioInput}
                            onChange={e => setSelectedAudioInput(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 10,
                                border: `1px solid ${T.border}`, background: T.bg, color: T.text,
                                fontSize: 12, fontFamily: font, cursor: 'pointer', outline: 'none',
                            }}
                        >
                            {devices.audioInputs.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Microfone ${devices.audioInputs.indexOf(d) + 1}`}</option>
                            ))}
                        </select>
                    </div>

                    {/* Speaker Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 8, fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🔊 Alto-falante (Saída de áudio)
                        </label>
                        <select
                            value={selectedAudioOutput}
                            onChange={e => setSelectedAudioOutput(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 10,
                                border: `1px solid ${T.border}`, background: T.bg, color: T.text,
                                fontSize: 12, fontFamily: font, cursor: 'pointer', outline: 'none',
                            }}
                        >
                            {devices.audioOutputs.length === 0 ? (
                                <option value="">Padrão do sistema</option>
                            ) : (
                                devices.audioOutputs.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Alto-falante ${devices.audioOutputs.indexOf(d) + 1}`}</option>
                                ))
                            )}
                        </select>
                        <div style={{ fontSize: 10, color: T.textDim, marginTop: 6, fontFamily: font }}>
                            ℹ️ Nem todos os navegadores suportam seleção de saída de áudio
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
                    <button onClick={handleClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>Cancelar</button>
                    <button onClick={handleSave} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>Salvar</button>
                </div>
            </div>
        </div>
    )
}
