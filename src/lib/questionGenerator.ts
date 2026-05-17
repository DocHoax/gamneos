import type { ChallengeQuestion, DragDropItem } from '../types';

export const MISSION_QUESTION_COUNT = 51;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function pickRandom<T>(pool: T[], count: number): T[] {
  if (pool.length === 0) {
    return [];
  }

  const bag = shuffle(pool);
  const picked: T[] = [];

  while (picked.length < count) {
    picked.push(...bag);
  }

  return shuffle(picked).slice(0, count);
}

function rotateOptions(options: string[], correctIndex: number, shift: number) {
  const rotated = options.map((_, index) => options[(index + shift) % options.length]);
  const correctAnswer = options[correctIndex];
  const nextCorrectIndex = rotated.indexOf(correctAnswer);
  return { options: rotated, correctIndex: nextCorrectIndex };
}

function buildPhishingQuizPool(): ChallengeQuestion[] {
  const core: Omit<ChallengeQuestion, 'id'>[] = [
    {
      prompt: 'What is the safest response to an unexpected password-reset email?',
      options: ['Click the link to reset quickly', 'Open the reset page through a bookmarked official site', 'Reply with your current password', 'Forward the email to everyone'],
      correctIndex: 1,
      explanation: 'Navigate to trusted sites directly instead of using email links.',
    },
    {
      prompt: 'Which sign most strongly suggests a phishing message?',
      options: ['A company logo in the header', 'A mismatched link destination versus displayed text', 'A polite greeting', 'A message received on Tuesday'],
      correctIndex: 1,
      explanation: 'Hovering and checking destinations exposes deceptive links.',
    },
    {
      prompt: 'A vendor asks for an urgent wire transfer by email. What is best?',
      options: ['Process immediately to avoid delays', 'Verify using a known contact method before paying', 'Send banking details in reply', 'Ignore forever without reporting'],
      correctIndex: 1,
      explanation: 'Financial requests need out-of-band verification.',
    },
    {
      prompt: 'What should you do with a suspicious attachment?',
      options: ['Open it in protected view only', 'Avoid opening it and report through security channels', 'Rename it and open later', 'Upload it to a public drive'],
      correctIndex: 1,
      explanation: 'Attachments can execute malware or steal credentials.',
    },
    {
      prompt: 'Why is urgency language risky in email?',
      options: ['It makes messages shorter', 'It pressures people to skip verification', 'It improves deliverability', 'It proves authenticity'],
      correctIndex: 1,
      explanation: 'Attackers use urgency to bypass careful thinking.',
    },
  ];

  const deadlines = ['10 minutes', '30 minutes', '1 hour', 'before end of day', 'tonight', 'by 5 PM', 'within the hour', 'before midnight'];
  const channels = ['payroll portal', 'bank account', 'cloud mailbox', 'benefits account', 'tax portal', 'file share', 'VPN access', 'expense system'];
  const generated = channels.flatMap((channel, channelIndex) =>
    deadlines.map((deadline, deadlineIndex) => {
      const options = [
        `Click the email link to unlock your ${channel}`,
        `Use a known official channel to verify the ${channel} alert`,
        `Reply with your password to confirm access`,
        `Ignore security policy and wait`,
      ];
      const { options: rotated, correctIndex } = rotateOptions(options, 1, (channelIndex + deadlineIndex) % 4);

      return {
        prompt: `An email warns your ${channel} will be locked in ${deadline}. What is the safest first step?`,
        options: rotated,
        correctIndex,
        explanation: 'Treat unexpected lockout warnings as suspicious until verified through trusted channels.',
      };
    }),
  );

  return [...core, ...generated].map((question, index) => ({
    ...question,
    id: `phish-pool-${index + 1}`,
  }));
}

function buildPasswordQuizPool(): ChallengeQuestion[] {
  const core: Omit<ChallengeQuestion, 'id'>[] = [
    {
      prompt: 'What makes a password strongest for daily use?',
      options: ['A memorable pet name', 'A long unique passphrase stored in a password manager', 'The same strong password reused everywhere', 'Your birth year with symbols'],
      correctIndex: 1,
      explanation: 'Length, uniqueness, and a manager reduce guessing and reuse risk.',
    },
    {
      prompt: 'How should teams handle shared admin credentials?',
      options: ['Post them in chat for speed', 'Use a vault with rotation and individual accountability', 'Email them weekly', 'Write them on a whiteboard'],
      correctIndex: 1,
      explanation: 'Privileged access should be vaulted, rotated, and audited.',
    },
    {
      prompt: 'When is MFA most valuable?',
      options: ['Only on public Wi-Fi', 'On every sensitive login, especially remote access', 'Never for executives', 'Only after a breach'],
      correctIndex: 1,
      explanation: 'MFA blocks many credential-stuffing and phishing attacks.',
    },
  ];

  const services = [
    'email',
    'banking',
    'HR portal',
    'code repository',
    'cloud console',
    'support desk',
    'file sync',
    'learning platform',
    'chat app',
    'analytics dashboard',
    'vendor portal',
    'backup console',
  ];
  const habits = [
    'reuse one favorite password',
    'use a unique passphrase per service',
    'share passwords in spreadsheets',
    'rotate passwords every hour manually',
    'store passwords in browser notes',
  ];

  const generated = services.flatMap((service, serviceIndex) =>
    habits.map((habit, habitIndex) => {
      const options = [
        `${habit} for ${service}`,
        `Use a password manager with unique credentials for ${service}`,
        `Text credentials for ${service} to a teammate`,
        `Disable lock screens for ${service}`,
      ];
      const { options: rotated, correctIndex } = rotateOptions(options, 1, (serviceIndex + habitIndex) % 4);

      return {
        prompt: `Which practice best protects your ${service} account?`,
        options: rotated,
        correctIndex,
        explanation: 'Unique credentials and managers limit blast radius when one site is compromised.',
      };
    }),
  );

  return [...core, ...generated].map((question, index) => ({
    ...question,
    id: `password-pool-${index + 1}`,
  }));
}

function buildDeviceQuizPool(): ChallengeQuestion[] {
  const core: Omit<ChallengeQuestion, 'id'>[] = [
    {
      prompt: 'What is the best response to a missing security patch?',
      options: ['Wait until next year', 'Apply tested patches on a defined schedule', 'Disable updates for stability', 'Install random tools instead'],
      correctIndex: 1,
      explanation: 'Routine patching closes known exploitation paths.',
    },
    {
      prompt: 'How should you use public Wi-Fi for work?',
      options: ['Access sensitive systems without protection', 'Prefer VPN or avoid sensitive tasks on untrusted networks', 'Share the hotspot password publicly', 'Turn off disk encryption'],
      correctIndex: 1,
      explanation: 'Untrusted networks can intercept or manipulate traffic.',
    },
    {
      prompt: 'What protects data if a laptop is stolen?',
      options: ['Bright wallpaper', 'Full-disk encryption with strong authentication', 'Larger fonts', 'More desktop icons'],
      correctIndex: 1,
      explanation: 'Encryption helps prevent offline data theft.',
    },
  ];

  const devices = [
    'laptop',
    'phone',
    'tablet',
    'workstation',
    'kiosk',
    'server',
    'router',
    'backup drive',
    'printer',
    'conference room PC',
  ];
  const risks = [
    'unknown USB drive',
    'unapproved browser extension',
    'open RDP to the internet',
    'disabled firewall',
    'shared local admin account',
    'outdated operating system build',
  ];

  const generated = devices.flatMap((device, deviceIndex) =>
    risks.map((risk, riskIndex) => {
      const options = [
        `Ignore ${risk} on the ${device}`,
        `Remove the ${risk} and follow endpoint policy on the ${device}`,
        `Publish ${device} credentials for convenience`,
        `Disable logging on the ${device}`,
      ];
      const { options: rotated, correctIndex } = rotateOptions(options, 1, (deviceIndex + riskIndex) % 4);

      return {
        prompt: `You discover ${risk} on a ${device}. What is the best action?`,
        options: rotated,
        correctIndex,
        explanation: 'Endpoint hygiene reduces malware, lateral movement, and data loss.',
      };
    }),
  );

  return [...core, ...generated].map((question, index) => ({
    ...question,
    id: `device-pool-${index + 1}`,
  }));
}

function buildPhishingDragPool(): Omit<DragDropItem, 'id'>[] {
  const safe = [
    'You typed the official URL yourself',
    'Request confirmed in your internal ticketing system',
    'Message includes expected anti-phish banner formatting',
    'Callback number matches the company handbook',
    'Sender domain exactly matches the known corporate domain',
    'Link destination matches the displayed brand domain',
    'Attachment requested through approved secure file exchange',
    'Security team already published an advisory about this campaign',
    'MFA prompt appears only after you opened the real app',
    'Invoice references a purchase order you already approved internally',
    'Email thread continues a conversation started in a verified ticket',
    'Domain uses official corporate DKIM alignment',
    'No request for credentials or one-time codes in the body',
    'Instructions match the published security policy wording',
    'Sender address uses the standard corporate subdomain',
    'You verified the request with the requester on Teams using prior chat history',
  ];

  const risk = [
    'Email demands your password to restore access',
    'Link hidden behind an unknown URL shortener',
    'Sender domain has a subtle misspelling',
    'Message threatens account closure within minutes',
    'Attachment asks you to enable macros immediately',
    'Login page certificate warning appears in the browser',
    'Unexpected wire transfer with changed bank details',
    'QR code from an unknown poster redirects to a login form',
    'Generic greeting with mismatched display name',
    'Reply-to address differs from the From address',
    'Embedded image contains a disguised hyperlink',
    'Message asks you to disable antivirus to open a file',
    'Prize claim requires immediate card details',
    'Executive impersonation sent from a free webmail domain',
    'File share link requests OAuth consent to unknown app',
    'Phone number in the email does not match corporate directory',
  ];

  return [
    ...safe.map((label) => ({ label, targetZoneId: 'safe-signal', explanation: 'This signal supports verification or lower risk.' })),
    ...risk.map((label) => ({ label, targetZoneId: 'risk-signal', explanation: 'This signal suggests urgency, spoofing, or deception.' })),
  ];
}

const quizPools: Record<string, ChallengeQuestion[]> = {
  'phishing-awareness': buildPhishingQuizPool(),
  'password-defense': buildPasswordQuizPool(),
  'device-hygiene': buildDeviceQuizPool(),
};

const dragPools: Record<string, Omit<DragDropItem, 'id'>[]> = {
  'phishing-awareness': buildPhishingDragPool(),
};

export function getQuizPool(topicId: string): ChallengeQuestion[] {
  return quizPools[topicId] ?? buildPhishingQuizPool();
}

export function getDragPool(topicId: string): Omit<DragDropItem, 'id'>[] {
  return dragPools[topicId] ?? buildPhishingDragPool();
}

export function pickMissionQuestions(topicId: string, count = MISSION_QUESTION_COUNT): ChallengeQuestion[] {
  return pickRandom(getQuizPool(topicId), count);
}

export function pickMissionDragItems(topicId: string, count = MISSION_QUESTION_COUNT): DragDropItem[] {
  const templates = pickRandom(getDragPool(topicId), count);

  return templates.map((item, index) => ({
    ...item,
    id: `drag-session-${index + 1}`,
  }));
}

export function totalQuestionsInPools(): number {
  return Object.values(quizPools).reduce((sum, pool) => sum + pool.length, 0);
}
