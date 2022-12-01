import { css, html, LitElement, TemplateResult } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
//@ts-ignore
import style from '../../../styles/form-styles.css';
//@ts-ignore
import ModalStyles from '../../../styles/modal-styles.css';
import '../components/info-circle-tooltip';
import { customElement } from 'lit/decorators.js';
import { PackageOptions } from '../utils/interfaces';

/**
 * Base class for app package forms, e.g. the Windows package form, the Android package form, the iOS package form, etc.
 * Shares styles across forms and shares common code, such as form label + input rendering, accordion toggling, etc.
 */
@customElement('app-package-form-base')
export class AppPackageFormBase extends LitElement {

  static get styles() {
    const localStyles =  css`
      #form-layout input {
        border: 1px solid rgba(194, 201, 209, 1);
        border-radius: var(--input-border-radius);
        color: var(--font-color);
      }

      #form-layout input:not([type='color']) {
        padding: 10px;
      }

      input::placeholder {
        color: var(--placeholder-color);
        font-style: italic;
      }


      info-circle-tooltip {
        margin-top: 4px;
      }

      #form-extras sl-button::part(base) {
        background-color: black;
        color: white;
        font-size: 14px;
        height: 3em;
        width: 25%;
        border-radius: var(--button-border-radius);
      }

      #form-extras sl-button::part(label){
        display: flex;
        align-items: center;
      }

      #form-layout {
        overflow-y: auto;
        padding: 0em 1.5em 0 1em;
      }

      .tooltip {
        margin-left: 10px;
      }

      .form-group .tooltip a {
        color: #fff;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        font-size: var(--small-medium-font-size);
        font-weight: bold;
        line-height: 40px;
        display: flex;
        align-items: center;
      }

      .form-group label a {
        text-decoration: none;
        color: var(--font-color);
      }

      #form-options-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: .25em;
      }

      #form-details-block {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        justify-content: space-between;
        width: 55%;
        gap: .25em;
      }

      #form-details-block p {
        font-weight: 300;
        font-size: 14px;
        color: #808080;
        margin: 0;
      }

      .select-group {
        display: flex;
        margin-bottom: 10px;
        padding-left: 2em;
      }

      #all-settings-header {
        color: var(--font-color);
        font-weight: var(--font-bold);
        font-size: 18px;

        display: flex;
        align-items: center;
      }

      .form-check {
        display: flex;
        align-items: center;
      }

      .form-check label {
        font-weight: normal;
        margin-left: 8px;
      }

      #form-layout input:invalid {
        color: var(--error-color);
        border: 1px solid var(--error-color);
      }


      @media (min-height: 760px) and (max-height: 1000px) {
        form {
          width: 100%;
        }
      }
    `
    return [localStyles];
  }

  constructor() {
    super();
  }

  getPackageOptions(): PackageOptions {
    return {};
  }

  getForm(): HTMLFormElement | undefined {
    return undefined;
  }

  protected renderFormInput(formInput: FormInput): TemplateResult {
    // If it's a checkbox or radio, the label comes after the check
    if (formInput.type === 'checkbox' || formInput.type === 'radio') {
      return html`
        ${this.renderFormInputTextbox(formInput)}
        ${this.renderFormInputLabel(formInput)}
      `;
    }

    // For all others, the label comes first.
    return html`
      ${this.renderFormInputLabel(formInput)}
      ${this.renderFormInputTextbox(formInput)}
    `;
  }

  private renderFormInputTextbox(formInput: FormInput): TemplateResult {
    const inputType = formInput.type || 'text';
    const inputClass = formInput.type === 'radio' ? 'form-check-input' : 'form-control';
    return html`
      <input id="${formInput.inputId}" class="${inputClass}" placeholder="${formInput.placeholder || ''}"
        value="${ifDefined(formInput.value)}" type="${inputType}" ?required="${formInput.required}"
        name="${ifDefined(formInput.name)}" minlength="${ifDefined(formInput.minLength)}"
        maxlength="${ifDefined(formInput.maxLength)}" min=${ifDefined(formInput.minValue)}
        max="${ifDefined(formInput.maxValue)}" pattern="${ifDefined(formInput.pattern)}"
        spellcheck="${ifDefined(formInput.spellcheck)}" ?checked="${formInput.checked}" ?readonly="${formInput.readonly}"
        custom-validation-error-message="${ifDefined(formInput.validationErrorMessage)}"
        @input="${(e: UIEvent) => this.inputChanged(e, formInput)}" @invalid=${this.inputInvalid} />
    `;
  }

  private renderFormInputLabel(formInput: FormInput): TemplateResult {
    return html`
      <label for="${formInput.inputId}">
        ${formInput.label}
        ${this.renderTooltip(formInput)}
      </label>
    `;
  }

  protected renderTooltip(formInput: FormInput): TemplateResult {
    if (!formInput.tooltip) {
      return html``;
    }

    // Ensure we have an ID for this element. If not, add one.
    // We need it for the tooltip.
    if (!formInput.inputId) {
      formInput.inputId = Math.random().toString(36).replace('0.', 'form-input-');
    }

    return html`
      <info-circle-tooltip text="${formInput.tooltip}" link="${ifDefined(formInput.tooltipLink)}">
      </info-circle-tooltip>
    `;
  }

  private inputChanged(e: UIEvent, formInput: FormInput) {
    const inputElement = e.target as HTMLInputElement | null;
    if (inputElement) {
      // Fire the input handler
      if (formInput.inputHandler) {
        formInput.inputHandler(inputElement.value || '', inputElement.checked, inputElement);
      }

      // Run validation if necessary.
      if (formInput.validationErrorMessage) {
        const errorMessage = this.inputHasValidationErrors(inputElement) ? formInput.validationErrorMessage : '';
        inputElement.setCustomValidity(errorMessage);
        inputElement.title = errorMessage;
      }
    }
  }

  private inputInvalid(e: UIEvent) {
    const element = e.target as HTMLInputElement;
    if (element) {
      this.expandParentAccordionIfNeeded(element);
    }
  }

  private inputHasValidationErrors(input: HTMLInputElement): boolean {
    const statesChecked = [
      input.validity.badInput,
      input.validity.patternMismatch,
      input.validity.rangeOverflow,
      input.validity.rangeUnderflow,
      input.validity.stepMismatch,
      input.validity.tooLong,
      input.validity.tooShort,
      input.validity.typeMismatch,
      input.validity.valueMissing
    ];

    return statesChecked.some(s => s === true);
  }

  private expandParentAccordionIfNeeded(element: HTMLInputElement) {
    // If the accordion is hiding any invalid inputs, open it.
    const isInvalid = !element.validity.valid;
    const parentAccordion = element.closest('fast-accordion-item');
    if (parentAccordion && (parentAccordion as any).expanded === false && isInvalid) {
      const accordionFlipper = parentAccordion.querySelector<HTMLElement>(".flipper-button");
      accordionFlipper?.click();
      setTimeout(() => {
        element.scrollIntoView();
        element.reportValidity();
      }, 0);
    }
  }
}

export interface FormInput {
  label: string;
  tooltip?: string;
  tooltipLink?: string;
  inputId: string;
  name?: string;
  type?: 'hidden' | 'text' | 'search' | 'tel' | 'url' | 'email' | 'password' | 'datetime' | 'date' | 'month' | 'week' | 'time' | 'datetime-local' | 'number' | 'range' | 'color' | 'checkbox' | 'radio' | 'file' | 'submit' | 'image' | 'reset' | 'button'
  placeholder?: string;
  value?: string | string[];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  spellcheck?: boolean;
  readonly?: boolean;
  validationErrorMessage?: string;
  checked?: boolean;
  inputHandler?: (val: string, checked: boolean, input: HTMLInputElement) => void;
}