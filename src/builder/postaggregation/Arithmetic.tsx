import React, { FC, PureComponent, ChangeEvent } from 'react';
import { Select, Button, Icon, LegacyForms, stylesFactory } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { css } from 'emotion';
import uniqueId from 'lodash/uniqueId';
import { QueryBuilderProps, QueryBuilderOptions } from '../types';
import { PostAggregation } from './.';

const { FormField } = LegacyForms;

interface State {
  components: string[];
}

interface ComponentRowProps {
  index: number;
  component: any;
  props: any;
  onRemove: (index: number) => void;
}

const getComponentRowStyles = stylesFactory(() => {
  return {
    layout: css`
      display: flex;
      margin-bottom: 4px;
      > * {
        margin-left: 4px;
        margin-bottom: 0;
        height: 100%;
        &:first-child,
        &:last-child {
          margin-left: 0;
        }
      }
    `,
  };
});

const ComponentRow: FC<ComponentRowProps> = ({ index, component, props, onRemove }: ComponentRowProps) => {
  const styles = getComponentRowStyles();
  const Component = component;
  return (
    <div className={styles.layout}>
      <Component {...props} />
      <Button variant="secondary" size="xs" onClick={(_e) => onRemove(index)}>
        <Icon name="trash-alt" />
      </Button>
    </div>
  );
};

ComponentRow.displayName = 'ComponentRow';

export class Arithmetic extends PureComponent<QueryBuilderProps, State> {
  state: State = {
    components: [],
  };

  constructor(props: QueryBuilderProps) {
    super(props);
    this.resetBuilder(['type', 'name', 'fn', 'fields', 'ordering']);
    const { builder } = props.options;
    builder.type = 'cardinality';
    if (undefined === builder.fields) {
      builder.fields = [];
    }
    this.initializeState();
  }

  initializeState = () => {
    this.props.options.builder.fields.forEach(() => {
      this.state.components.push(uniqueId());
    });
  };

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
    let value: any = event.target.value;
    if ('number' === event.target.type) {
      value = Number(value);
    }
    builder[event.target.name] = value;
    onOptionsChange({ ...options, builder: builder });
  };

  componentOptions = (index: number): QueryBuilderOptions => {
    const { builder, settings } = this.props.options;
    let componentBuilder = {};
    if (index <= builder.fields.length - 1) {
      componentBuilder = builder.fields[index];
    }
    return { builder: componentBuilder, settings: settings || {} };
  };

  onComponentOptionsChange = (index: number, componentOptions: QueryBuilderOptions) => {
    const { options, onOptionsChange } = this.props;
    const { builder, settings } = options;
    builder.fields[index] = componentOptions.builder;
    onOptionsChange({ ...options, builder, settings: { ...settings, ...componentOptions.settings } });
  };

  onComponentAdd = () => {
    const { options, onOptionsChange } = this.props;
    const { builder } = options;
    builder.fields.push({});
    onOptionsChange({ ...options, builder });
    this.setState(({ components }) => {
      return { components: [...components, uniqueId()] };
    });
  };

  onComponentRemove = (index: number) => {
    const { options, onOptionsChange } = this.props;
    const { builder } = options;
    builder.fields = builder.fields.filter((element: any, idx: number) => index !== idx);
    onOptionsChange({ ...options, builder });
    this.setState(({ components }) => ({
      components: components.filter((element: string, idx: number) => {
        return idx !== index;
      }),
    }));
  };

  selectOptions: Record<string, Array<SelectableValue<string>>> = {
    fn: [
      { label: 'Plus', value: '+' },
      { label: 'Minus', value: '-' },
      { label: 'Multiply', value: '*' },
      { label: 'Divide', value: '/' },
      { label: 'Quotient', value: 'quotient' },
    ],
    ordering: [
      { label: 'Null', value: 'null' },
      { label: 'Numeric first', value: 'numericFirst' },
    ],
  };

  selectOptionByValue = (component: string, value: string): SelectableValue<string> | undefined => {
    if (undefined === value) {
      return undefined;
    }
    const options = this.selectOptions[component].filter((option) => option.value === value);
    if (options.length > 0) {
      return options[0];
    }
    return undefined;
  };

  onSelectionChange = (component: string, option: SelectableValue<string>) => {
    this.selectOption(component, option);
  };

  onCustomSelection = (component: string, selection: string) => {
    const option: SelectableValue<string> = { value: selection.toLowerCase(), label: selection };
    this.selectOptions[component].push(option);
    this.selectOption(component, option);
  };

  selectOption = (component: string, option: SelectableValue<string>) => {
    const { options, onOptionsChange } = this.props;
    const { builder, settings } = options;
    let value: string | null | undefined = option.value;
    if ('null' === value) {
      value = null;
    }
    builder[component] = value;
    onOptionsChange({ ...options, builder, settings });
  };

  render() {
    const { builder } = this.props.options;
    const { components } = this.state;
    return (
      <>
        <div className="gf-form">
          <div
            className={css`
              width: 300px;
            `}
          >
            <FormField
              label="Name"
              name="name"
              type="text"
              placeholder="Output name for the summed value"
              value={builder.name}
              onChange={this.onInputChange}
            />
            <label className="gf-form-label">Function</label>
            <Select
              options={this.selectOptions.fn}
              value={this.selectOptionByValue('fn', builder.fn)}
              allowCustomValue
              onChange={this.onSelectionChange.bind(this, 'fn')}
              onCreateOption={this.onCustomSelection.bind(this, 'fn')}
              isClearable={true}
            />
            <label className="gf-form-label">Post aggregations</label>
            <div>
              {builder.fields.map((item: any, index: number) => (
                <ComponentRow
                  key={components[index]}
                  index={index}
                  component={PostAggregation}
                  props={{
                    options: this.componentOptions(index),
                    onOptionsChange: this.onComponentOptionsChange.bind(this, index),
                  }}
                  onRemove={this.onComponentRemove}
                />
              ))}
            </div>
            <Button variant="secondary" icon="plus" onClick={this.onComponentAdd}>
              Add post aggregation
            </Button>
            <label className="gf-form-label">Ordering</label>
            <Select
              options={this.selectOptions.ordering}
              value={this.selectOptionByValue('ordering', builder.ordering)}
              allowCustomValue
              onChange={this.onSelectionChange.bind(this, 'ordering')}
              onCreateOption={this.onCustomSelection.bind(this, 'ordering')}
              isClearable={true}
            />
          </div>
        </div>
      </>
    );
  }
}
