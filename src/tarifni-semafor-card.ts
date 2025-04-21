import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface TarifniSemaforCardConfig {
  current_block?: string;
  next_block?: string;
  progress?: string;
  show_header?: boolean;
  show_legend?: boolean;
}

@customElement('tarifni-semafor-card')
export class TarifniSemaforCard extends LitElement {
  @property({ attribute: false }) hass!: any;
  @state() private _config!: TarifniSemaforCardConfig;
  @state() private _animatedProgress: number = 0;

  async setConfig(config: TarifniSemaforCardConfig) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;

    const helpers = await (window as any).loadCardHelpers?.();
    if (!helpers || !config.progress) {
      return;
    }

    this._animatedProgress = 0

  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "current_block",
          required: true,
          selector: { entity: { domain: "sensor" } },
        },
        {
          name: "next_block",
          required: false,
          selector: { entity: { domain: "sensor" } },
        },
        {
          name: "progress",
          required: false,
          selector: { entity: { domain: "sensor" } },
        },
        {
          name: "show_header",
          required: false,
          default: true,
          selector: { boolean: {} },
        },
        {
          name: "show_legend",
          required: false,
          default: true,
          selector: { boolean: {} },
        },
      ],
    };
  }

  static getStubConfig(): TarifniSemaforCardConfig {
    return {
      current_block: 'sensor.tarifni_semafor_current_block',
      next_block: 'sensor.tarifni_semafor_next_block',
      progress: 'sensor.tarifni_semafor_progress',
      show_header: true,
      show_legend: true,
    };
  }

  render() {


    if (!this._config) return html``;

    const currentBlock = this._getEntityValue(this._config.current_block);
    const nextBlock = this._getEntityValue(this._config.next_block);
    const nextBlockStart = this._getEntityAttribute(this._config.next_block, 'block_start');

    const progressEntity = this.hass?.states?.[this._config.progress ?? ''];
    const blockLeft = parseFloat(progressEntity?.attributes?.block_left ?? '0');
    const blockLeftTime = this._formatTimeLeft(blockLeft);

    const color = this._getBlockColor(this._getCurrentBlockId(this._config.current_block));

    return html`
    <ha-card .header=${this._config.show_header ? "Tarifni semafor" : null}>
      <div class="tarifni-semafor-card">
        <div class="block-row">
          <span class="label">Current block, ends in: <span class="label-data">${blockLeftTime}</span></span>
          <span class="block-indicator current" style="background-color: ${this._getBlockColor(this._getCurrentBlockId(this._config.current_block))};">
            ${currentBlock ?? 'N/A'}
          </span>
        </div>
        <div class="block-row">
          <span class="label">Next block, starts at: <span class="label-data">${nextBlockStart}</span></span>
          <span class="block-indicator next" style="background-color: ${this._getBlockColor(this._getCurrentBlockId(this._config.next_block))};">
            ${nextBlock ?? 'N/A'}
          </span>
        </div>
        <div class="block-row"><span class="label">Block progress</span>
          <div class="progress-container">
            <div class="progress-container">
              <div class="progress-bar"
                style="width: ${this._animatedProgress}%; background-color: ${color};"></div>
              </div>
          </div>
        </div>
      </div>
      ${this._config.show_legend
        ? html`
            <div class="block-legend">
              ${[1, 2, 3, 4, 5].map(
                (block) => html`
                  <div class="legend-item">
                    <span class="legend-color" style="background-color: ${this._getBlockColor(block)};"></span>
                    <span class="legend-label">Block ${block}</span>
                  </div>
                `
              )}
            </div>
          `
        : null}
    </ha-card>
  `;
  }

  updated() {
    const blockLeft = parseFloat(this._getEntityAttribute(this._config.progress, 'block_left') ?? '0');
    const blockTotal = parseFloat(this._getEntityAttribute(this._config.progress, 'block_total') ?? '0');
    const progressRatio = blockTotal > 0 ? (1 - blockLeft / blockTotal) : 0;

    requestAnimationFrame(() => {
      this._animatedProgress = Math.round(progressRatio * 100);
    });
  }

  private _getEntityValue(entityId?: string): string | undefined {
    return entityId && this.hass?.states?.[entityId]?.state;
  }

  private _getEntityAttribute(entityId: string | undefined, attr: string): any {
    return entityId && this.hass?.states?.[entityId]?.attributes?.[attr];
  }

  private _getCurrentBlockId(entityId?: string): number | undefined {
    return entityId && this.hass?.states?.[entityId]?.attributes?.block_id;
  }

  private _getBlockColor(block: number | undefined): string {
    switch (block) {
      case 1: return "#d32f2f"; // Red
      case 2: return "#f57c00"; // Orange
      case 3: return "#fbc02d"; // Yellow
      case 4: return "#7cb342"; // Light Green
      case 5: return "#388e3c"; // Green
      default: return "var(--secondary-text-color)";
    }
  }

  private _formatTimeLeft(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
  }
  
  static styles = css`
    ha-card {
      padding: 16px;
    }

    .tarifni-semafor-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .block-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-size: 14px;
      color: var(--secondary-text-color);
    }

    .label-data {
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .block-indicator {
      padding: 10px 20px;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      font-size: 16px;
      text-align: center;
      min-width: 64px;
    }

    .block-indicator.next {
      font-size: 14px;
      padding: 4px 20px;
    }
    
    .progress-container {
      width: 100%;
      height: 1.3rem;
      background-color: var(--divider-color);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background-color: var(--primary-color);
      transition: width 0.5s ease;
    }

    .block-legend {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      display: inline-block;
    }
    
    .legend-label {
      font-size: 14px;
      color: var(--secondary-text-color);
    }
  `;
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'tarifni-semafor-card',
  name: 'Tarifni Semafor Card',
  description: 'Displays the current and next electricity tariff block.'
});
