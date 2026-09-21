import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { parseUID, generateUID, BRANCHES, calculateYearFromSem } from '../../utils/uidUtils';
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, X, Edit3 } from 'lucide-react';
import AnimatedModal from '../ui/AnimatedModal';

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import ImageCropperModal from '../components/ImageCropperModal';
import PdfViewerModal from '../components/PdfViewerModal';
import AnimatedModal from '../components/ui/AnimatedModal';
import RichTextEditor from '../components/RichTextEditor';
import RichContentRenderer from '../components/RichContentRenderer';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculateProfileCompleteness } from '../utils/profileUtils';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import {
  Camera,
  Edit3,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Calendar,
  MapPin,
  Building2,
  MessageSquare,
  Share2,
  Globe,
  ShieldCheck,
  Layers,
  LayoutDashboard,
  User,
  X,
  Upload,
  AlertTriangle,
  Code2,
  CheckCheck,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { parseUID, generateUID, BRANCHES, calculateYearFromSem } from '../utils/uidUtils';

const formatExternalUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// =============================================================================
// 1. ONBOARDING SETUP OVERLAY (Geist Material Modal)
// =============================================================================
