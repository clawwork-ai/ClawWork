import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

let mermaidInitialized = false;

function ensureMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    themeVariables: {
      background: '#0f1115',
      primaryColor: '#1a1d24',
      primaryTextColor: '#f5f7fa',
      primaryBorderColor: '#2a2f3a',
      lineColor: '#8a93a5',
      secondaryColor: '#151922',
      tertiaryColor: '#10141c',
      mainBkg: '#1a1d24',
      secondBkg: '#151922',
      tertiaryBkg: '#10141c',
      clusterBkg: '#10141c',
      clusterBorder: '#2a2f3a',
      edgeLabelBackground: '#0f1115',
      textColor: '#d6dbe4',
      actorTextColor: '#f5f7fa',
      actorBorder: '#2a2f3a',
      actorBkg: '#1a1d24',
      signalColor: '#d6dbe4',
      signalTextColor: '#d6dbe4',
      labelBoxBkgColor: '#10141c',
      labelBoxBorderColor: '#2a2f3a',
      noteBkgColor: '#151922',
      noteBorderColor: '#2a2f3a',
      noteTextColor: '#d6dbe4',
      activationBorderColor: '#0ffd0d',
      activationBkgColor: '#0ffd0d22',
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
      wrap: true,
    },
  });
  mermaidInitialized = true;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        ensureMermaid();
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);
        if (cancelled) return;
        setSvg(renderedSvg);
        setError('');
      } catch (err) {
        if (cancelled) return;
        setSvg('');
        setError(err instanceof Error ? err.message : 'Failed to render Mermaid diagram.');
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="mermaid-block mermaid-block-error">
        <div className="mermaid-error-title">Mermaid render failed</div>
        <pre>
          <code>{chart}</code>
        </pre>
        <p>{error}</p>
      </div>
    );
  }

  if (!svg) {
    return <div className="mermaid-block mermaid-block-loading">Rendering diagram...</div>;
  }

  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />;
}
