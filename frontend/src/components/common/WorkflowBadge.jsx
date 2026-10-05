import React from 'react';
import {
  Upload, Scissors, ShieldAlert, Sparkles, Eye,
  AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';

export function normalizeStageBadge(stage, fallbackStatus) {
  if (stage) {
    switch (stage) {
      case 'TASK_CREATED':
      case 'SMM_DRAFTING':
        return 'Task Created';
      case 'IN_ADMIN_GRAPHIC_REVIEW':
      case 'IN_ADMIN_REVIEW_EDITOR':
      case 'IN_ADMIN_REVIEW_SMM':
        return 'Admin Review';
      case 'IN_CLIENT_REVIEW':
        return 'Client Review';
      case 'NEEDS_REVISION_SMM':
      case 'REVISION_REQUIRED':
        return 'Revision Required';
      case 'NEEDS_REVISION_VIDEO':
        return 'Needs Revision - Video';
      case 'NEEDS_REVISION_CAPTION':
        return 'Needs Revision - Caption';
      case 'APPROVED':
      case 'PUBLISHED':
        return 'Fully Approved';
      case 'RAW_UPLOADED':
        return 'Raw Uploaded';
      case 'EDITING':
        return 'Editing';
      case 'SMM_CAPTIONING':
        return 'SMM Captioning';
      default:
        break;
    }
  }

  if (fallbackStatus) {
    const s = fallbackStatus.toLowerCase();
    if (s.includes('task created') || s.includes('drafting')) return 'Task Created';
    if (s.includes('client review')) return 'Client Review';
    if (s.includes('admin review')) return 'Admin Review';
    if (s.includes('revision required') || s === 'revision') return 'Revision Required';
    if (s.includes('caption') && s.includes('revision')) return 'Needs Revision - Caption';
    if (s.includes('video') && s.includes('revision')) return 'Needs Revision - Video';
    if (s.includes('fully approved') || s === 'approved' || s === 'completed') return 'Fully Approved';
    if (s.includes('captioning')) return 'SMM Captioning';
    if (s.includes('raw')) return 'Raw Uploaded';
    return fallbackStatus;
  }

  return 'Task Created';
}

export default function WorkflowBadge({ stage, status, size = 'md', showIcon = true }) {
  const badgeText = normalizeStageBadge(stage, status);

  // Badge configurations strictly matching prompt visual requirements
  const badgeConfig = {
    'Task Created': {
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.45)',
      color: '#7DD3FC',
      dot: '#38BDF8',
      icon: Sparkles
    },
    'SMM Drafting': {
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.45)',
      color: '#7DD3FC',
      dot: '#38BDF8',
      icon: Sparkles
    },
    'Admin Review': {
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.48)',
      color: '#FCD34D',
      dot: '#F59E0B',
      icon: ShieldAlert
    },
    'In Admin Review': {
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.48)',
      color: '#FCD34D',
      dot: '#F59E0B',
      icon: ShieldAlert
    },
    'Client Review': {
      bg: 'rgba(192, 132, 252, 0.16)',
      border: 'rgba(192, 132, 252, 0.45)',
      color: '#E9D5FF',
      dot: '#C084FC',
      icon: Eye
    },
    'In Client Review': {
      bg: 'rgba(192, 132, 252, 0.16)',
      border: 'rgba(192, 132, 252, 0.45)',
      color: '#E9D5FF',
      dot: '#C084FC',
      icon: Eye
    },
    'Revision Required': {
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.55)',
      color: '#FCA5A5',
      dot: '#EF4444',
      icon: AlertTriangle
    },
    'Needs Revision - Video': {
      bg: 'rgba(229, 9, 20, 0.18)',
      border: 'rgba(229, 9, 20, 0.5)',
      color: '#FCA5A5',
      dot: '#E50914',
      icon: AlertTriangle
    },
    'Needs Revision - Caption': {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(244, 63, 94, 0.45)',
      color: '#FDA4AF',
      dot: '#F43F5E',
      icon: AlertTriangle
    },
    'Fully Approved': {
      bg: 'rgba(16, 185, 129, 0.18)',
      border: 'rgba(16, 185, 129, 0.5)',
      color: '#6EE7B7',
      dot: '#10B981',
      icon: CheckCircle2
    },
    'Approved': {
      bg: 'rgba(16, 185, 129, 0.18)',
      border: 'rgba(16, 185, 129, 0.5)',
      color: '#6EE7B7',
      dot: '#10B981',
      icon: CheckCircle2
    },
    'Raw Uploaded': {
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.35)',
      color: '#93C5FD',
      dot: '#3B82F6',
      icon: Upload
    },
    'Editing': {
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.35)',
      color: '#FDE047',
      dot: '#EAB308',
      icon: Scissors
    },
    'SMM Captioning': {
      bg: 'rgba(20, 184, 166, 0.15)',
      border: 'rgba(20, 184, 166, 0.4)',
      color: '#5EEAD4',
      dot: '#14B8A6',
      icon: Sparkles
    }
  };

  const current = badgeConfig[badgeText] || {
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
    color: '#CBD5E1',
    dot: '#94A3B8',
    icon: Clock
  };

  const IconComponent = current.icon;
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '4px' : '6px',
        padding: isSm ? '2px 8px' : isLg ? '6px 14px' : '4px 10px',
        borderRadius: '9999px',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        fontSize: isSm ? '11px' : isLg ? '13px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        boxShadow: `0 0 10px ${current.bg}`
      }}
    >
      <span
        style={{
          width: isSm ? '5px' : '6px',
          height: isSm ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: current.dot,
          boxShadow: `0 0 6px ${current.dot}`
        }}
      />
      {showIcon && IconComponent && <IconComponent size={isSm ? 11 : isLg ? 14 : 12} />}
      <span>{badgeText}</span>
    </span>
  );
}
