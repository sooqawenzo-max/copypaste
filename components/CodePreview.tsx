'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Code2, Lock } from 'lucide-react';

type Props = {
  content: string;
  locked?: boolean;
  previewLines?: number;
};

export function CodePreview({ content, locked = false, previewLines = 10 }: Props) {
  const [expanded, setExpanded] = useState(false);
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
      visibleContent: expanded ? content : lines.slice(0, previewLines).join('\n'),
      hasMore: lines.length > previewLines
    };
  }, [content, expanded, locked, previewLines]);

  return (
    <div
      className={`code-frame ${locked ? 'locked-code' : ''} ${
        hasMore && !expanded ? 'preview-code' : ''
      }`}
    >
      <div className="code-title">
        {locked ? <Lock size={15} /> : <Code2 size={15} />}
        <span>{locked ? 'Locked preview' : expanded ? 'Full code' : 'Preview'}</span>
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
      {!locked && hasMore && !expanded ? (
        <div className="code-preview-overlay">
          <button
            className="show-more-code"
            onClick={() => setExpanded(true)}
            type="button"
          >
            <span>Дальше</span>
            <ChevronDown size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
