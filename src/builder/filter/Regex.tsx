import React, { PureComponent, ChangeEvent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { css } from 'emotion';
import { QueryBuilderProps, QueryBuilderOptions } from '../types';
import { ExtractionFn } from '../extractionfn';

const { FormField } = LegacyForms;

export class Regex extends PureComponent<QueryBuilderProps> {
  constructor(props: QueryBuilderProps) {
    super(props);
    this.resetBuilder(['type', 'dimension', 'pattern', 'extractionFn']);
    const { builder } = props.options;
    builder.type = 'regex';
  }

  resetBuilder = (properties: string[]) => {
    const { builder } = this.props.options;
    for (let key of Object.keys(builder)) {
      if (!properties.includes(key)) {
        delete builder[key];
      }
    }
  };

  onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { options, onOptionsChange } = this.props;
    const { builder } = options;
    builder[event.target.name] = event.target.value;
    onOptionsChange({ ...options, builder: builder });
  };

  onOptionsChange = (component: string, componentBuilderOptions: QueryBuilderOptions) => {
    const { options, onOptionsChange } = this.props;
    const { builder, settings } = options;
    builder[component] = componentBuilderOptions.builder;
    onOptionsChange({ ...options, builder, settings });
  };

  builderOptions = (component: string): QueryBuilderOptions => {
    const { builder, settings } = this.props.options;
    return { builder: builder[component] || {}, settings: settings || {} };
  };

  render() {
    const { builder } = this.props.options;
    return (
      <>
        <div className="gf-form">
          <div
            className={css`
              width: 300px;
            `}
          >
            <FormField
              label="Dimension"
              name="dimension"
              type="text"
              placeholder="the dimension name"
              value={builder.dimension}
              onChange={this.onInputChange}
            />
            <FormField
              label="Pattern"
              name="pattern"
              type="text"
              placeholder="the regex pattern"
              value={builder.pattern}
              onChange={this.onInputChange}
            />
            <ExtractionFn
              options={this.builderOptions('extractionFn')}
              onOptionsChange={this.onOptionsChange.bind(this, 'extractionFn')}
            />
          </div>
        </div>
      </>
    );
  }
}
