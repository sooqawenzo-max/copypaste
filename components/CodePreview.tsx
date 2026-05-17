'use client';

import { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download, ExternalLink, Lock } from 'lucide-react';

type Props = {
  content: string;
  locked?: boolean;
  previewLines?: number;
  downloadUrl?: string;
  filename?: string;
};

export function CodePreview({
  content,
  locked = false,
  previewLines = 10,
  downloadUrl,
  filename
}: Props) {
  const [copied, setCopied] = useState(false);
  const { visibleContent, hasMore } = useMemo(() => {
    if (locked) {
      return {
        visibleContent: `local access = request_login()
local file = "gamesense_locked.lua"

if access then
  loadstring(file)()
end`,
        hasMore: false
      };
    }

    const lines = content.split(/\r?\n/);
    return {
      visibleContent: lines.slice(0, previewLines).join('\n'),
      hasMore: lines.length > previewLines
    };
  }, [content, locked, previewLines]);

  async function copyFullFile() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`code-frame ${locked ? 'locked-code' : ''} ${hasMore ? 'preview-code' : ''}`}>
      <div className="code-title">
        {locked ? <Lock size={15} /> : <Code2 size={15} />}
        <span>{locked ? 'Locked preview' : 'Preview'}</span>
        {!locked ? (
          <div className="code-tools">
            <button className="code-tool-btn" onClick={copyFullFile} type="button">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'Скопировано' : 'Скопировать'}</span>
            </button>
            {downloadUrl ? (
              <a className="code-tool-btn" href={downloadUrl} download={filename || true}>
                <Download size={15} />
                <span>Скачать</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      <pre>
        <code>{visibleContent}</code>
      </pre>
      {locked ? (
        <div className="code-lock-overlay">
          <Lock size={18} />
          <span>Login to view code</span>
        </div>
      ) : null}
      {!locked && hasMore && downloadUrl ? (
        <div className="code-preview-overlay">
          <a className="show-more-code" href={downloadUrl} target="_blank" rel="noreferrer">
            <span>Дальше</span>
            <ExternalLink size={16} />
          </a>
        </div>
      ) : null}
    </div>
  );
}
