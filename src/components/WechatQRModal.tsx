import { useEffect } from 'react';
import { X } from 'lucide-react';
import './WechatQRModal.css';

interface WechatQRModalProps {
  wechatId: string;
  onClose: () => void;
}

export function WechatQRModal({ wechatId, onClose }: WechatQRModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="wechat-overlay" onClick={onClose}>
      <div className="wechat-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wechat-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <img src="/images/wechat-qr.png" alt="WeChat QR Code" className="wechat-qr-img" />
        <p className="wechat-modal-id">{wechatId}</p>
      </div>
    </div>
  );
}
