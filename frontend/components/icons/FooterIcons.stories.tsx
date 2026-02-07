import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  ShieldIcon, MailIcon, QuestionIcon, InfoIcon, DocumentIcon,
  MusicNoteIcon, GlobeIcon, HeartIcon, CodeIcon, UserIcon,
  DatabaseIcon, ExternalLinkIcon, CheckIcon, XMarkIcon,
  SearchIcon, ClockIcon, SendIcon, StepNumber,
  BugIcon, LightbulbIcon, ShareIcon, PlayIcon,
  DownloadIcon, PlaylistIcon, ArchiveIcon, ScaleIcon,
  EyeIcon, EyeOffIcon, MicrophoneIcon,
} from './FooterIcons';

const meta = {
  title: 'Primitives/Icons',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

const iconStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem',
  color: '#e8e0d4',
};

const labelStyle = {
  fontSize: '0.75rem',
  color: '#9a9488',
  minWidth: '120px',
};

export const AllIcons: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.25rem' }}>
      <div style={iconStyle}><ShieldIcon /> <span style={labelStyle}>ShieldIcon</span></div>
      <div style={iconStyle}><MailIcon /> <span style={labelStyle}>MailIcon</span></div>
      <div style={iconStyle}><QuestionIcon /> <span style={labelStyle}>QuestionIcon</span></div>
      <div style={iconStyle}><InfoIcon /> <span style={labelStyle}>InfoIcon</span></div>
      <div style={iconStyle}><DocumentIcon /> <span style={labelStyle}>DocumentIcon</span></div>
      <div style={iconStyle}><MusicNoteIcon /> <span style={labelStyle}>MusicNoteIcon</span></div>
      <div style={iconStyle}><GlobeIcon /> <span style={labelStyle}>GlobeIcon</span></div>
      <div style={iconStyle}><HeartIcon /> <span style={labelStyle}>HeartIcon</span></div>
      <div style={iconStyle}><CodeIcon /> <span style={labelStyle}>CodeIcon</span></div>
      <div style={iconStyle}><UserIcon /> <span style={labelStyle}>UserIcon</span></div>
      <div style={iconStyle}><DatabaseIcon /> <span style={labelStyle}>DatabaseIcon</span></div>
      <div style={iconStyle}><ExternalLinkIcon /> <span style={labelStyle}>ExternalLinkIcon</span></div>
      <div style={iconStyle}><CheckIcon /> <span style={labelStyle}>CheckIcon</span></div>
      <div style={iconStyle}><XMarkIcon /> <span style={labelStyle}>XMarkIcon</span></div>
      <div style={iconStyle}><SearchIcon /> <span style={labelStyle}>SearchIcon</span></div>
      <div style={iconStyle}><ClockIcon /> <span style={labelStyle}>ClockIcon</span></div>
      <div style={iconStyle}><SendIcon /> <span style={labelStyle}>SendIcon</span></div>
      <div style={iconStyle}><BugIcon /> <span style={labelStyle}>BugIcon</span></div>
      <div style={iconStyle}><LightbulbIcon /> <span style={labelStyle}>LightbulbIcon</span></div>
      <div style={iconStyle}><ShareIcon /> <span style={labelStyle}>ShareIcon</span></div>
      <div style={iconStyle}><PlayIcon /> <span style={labelStyle}>PlayIcon</span></div>
      <div style={iconStyle}><DownloadIcon /> <span style={labelStyle}>DownloadIcon</span></div>
      <div style={iconStyle}><PlaylistIcon /> <span style={labelStyle}>PlaylistIcon</span></div>
      <div style={iconStyle}><ArchiveIcon /> <span style={labelStyle}>ArchiveIcon</span></div>
      <div style={iconStyle}><ScaleIcon /> <span style={labelStyle}>ScaleIcon</span></div>
      <div style={iconStyle}><EyeIcon /> <span style={labelStyle}>EyeIcon</span></div>
      <div style={iconStyle}><EyeOffIcon /> <span style={labelStyle}>EyeOffIcon</span></div>
      <div style={iconStyle}><MicrophoneIcon /> <span style={labelStyle}>MicrophoneIcon</span></div>
    </div>
  ),
};

export const StepNumbers: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <StepNumber number={1} />
      <StepNumber number={2} />
      <StepNumber number={3} />
      <StepNumber number={4} />
    </div>
  ),
};

export const CustomSize: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: '#d4a060' }}>
      <MusicNoteIcon className="w-4 h-4" />
      <MusicNoteIcon className="w-6 h-6" />
      <MusicNoteIcon className="w-10 h-10" />
      <MusicNoteIcon className="w-16 h-16" />
    </div>
  ),
};
