const fs = require('fs');

const content = fs.readFileSync('src/pages/StudentProfile.jsx', 'utf-8');

const overlayStart = content.indexOf('function ProfileSetupOverlay');
const overlayEnd = content.indexOf('// =============================================================================\n// 2. RESUME & PORTFOLIO EDITOR MODAL (Geist Workspace Modal)');
const overlayCode = content.substring(overlayStart, overlayEnd);

const editorStart = content.indexOf('function ResumeEditorModal');
const editorEnd = content.indexOf('// =============================================================================\n// 3. MAIN STUDENT PROFILE PAGE');
const editorCode = content.substring(editorStart, editorEnd);

fs.mkdirSync('src/components/profile', { recursive: true });

fs.writeFileSync('src/components/profile/ProfileSetupOverlay.jsx', 
  `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { parseUID, generateUID, BRANCHES, calculateYearFromSem } from '../../utils/uidUtils';
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, X, Edit3 } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';

${overlayCode.replace(/function ProfileSetupOverlay/, 'export default function ProfileSetupOverlay')}`
);

fs.writeFileSync('src/components/profile/ResumeEditorModal.jsx', 
  `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { Edit3, X, Loader2, Sparkles, Upload, FileText, MessageSquare, Globe, Code2, GraduationCap, Plus, Trash2, Briefcase, FolderGit2, Award, ExternalLink, AlertTriangle } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

${editorCode.replace(/function ResumeEditorModal/, 'export default function ResumeEditorModal')}`
);

console.log('Extracted ProfileSetupOverlay and ResumeEditorModal successfully.');
