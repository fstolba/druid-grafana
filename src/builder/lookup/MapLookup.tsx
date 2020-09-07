import React, { FC, PureComponent } from 'react';
import { css } from 'emotion';
import uniqueId from 'lodash/uniqueId';
import { LegacyForms, Button, Icon, stylesFactory } from '@grafana/ui';
import { QueryBuilderProps } from '../types';

interface Entry {
  id: string;
  key: string;
  value: string;
}

interface State {
  entries: Entry[];
}

interface EntryRowProps {
  entry: Entry;
  onRemove: (id: string) => void;
  onChange: (value: Entry) => void;
  onBlur: () => void;
}

const getEntryRowStyles = stylesFactory(() => {
  return {
    layout: css`
      display: flex;
      align-items: center;
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

const EntryRow: FC<EntryRowProps> = ({ entry, onBlur, onChange, onRemove }) => {
  const styles = getEntryRowStyles();
  const { FormField } = LegacyForms;

  return (
    <div className={styles.layout}>
      <FormField
        label="Key"
        name="key"
        placeholder="The map key."
        labelWidth={5}
        value={entry.key || ''}
        onChange={e => onChange({ ...entry, key: e.target.value })}
        onBlur={onBlur}
      />
      <FormField
        label="Value"
        name="value"
        value={entry.value}
        labelWidth={5}
        placeholder="The map value."
        onChange={e => onChange({ ...entry, value: e.currentTarget.value })}
        onBlur={onBlur}
      />
      <Button variant="secondary" size="xs" onClick={_e => onRemove(entry.id)}>
        <Icon name="trash-alt" />
      </Button>
    </div>
  );
};

EntryRow.displayName = 'EntryRow';

export class MapLookup extends PureComponent<QueryBuilderProps, State> {
  state: State = {
    entries: [],
  };

  constructor(props: QueryBuilderProps) {
    super(props);
    this.resetBuilder(['type', 'map']);
    const { builder } = props.options;
    builder.type = 'map';
    this.initializeState();
  }

  initializeState = () => {
    if (undefined !== this.props.options.builder.map) {
      this.state = {
        entries: Object.entries(this.props.options.builder.map).map(entry => {
          return { id: uniqueId(), key: String(entry.shift()), value: String(entry.shift()) };
        }),
      };
    }
  };

  resetBuilder = (properties: string[]) => {
    const { builder } = this.props.options;
    for (let key of Object.keys(builder)) {
      if (!properties.includes(key)) {
        delete builder[key];
      }
    }
  };

  updateMap = () => {
    const { options, onOptionsChange } = this.props;
    const { builder } = options;
    const { entries } = this.state;
    builder.map = {};
    entries
      .filter(entry => entry.key !== '')
      .map(entry => {
        builder.map[entry.key] = entry.value;
      });
    onOptionsChange({ ...options, builder });
  };

  onEntryAdd = () => {
    this.setState(prevState => {
      return { entries: [...prevState.entries, { id: uniqueId(), key: '', value: '' }] };
    }, this.updateMap);
  };

  onEntryRemove = (id: string) => {
    this.setState(
      ({ entries }) => ({
        entries: entries.filter(e => e.id !== id),
      }),
      this.updateMap
    );
  };

  onEntryChange = (index: number, entry: Entry) => {
    this.setState(({ entries }) => {
      return {
        entries: entries.map((item, idx) => {
          if (idx !== index) {
            return item;
          }
          return { ...entry };
        }),
      };
    }, this.updateMap);
  };

  render() {
    const { entries } = this.state;

    return (
      <>
        <div className="gf-form">
          <div
            className={css`
              width: 300px;
            `}
          >
            <div className="gf-form-group">
              <label className="gf-form-label">Map</label>
              <div>
                {entries.map((entry: Entry, index: number) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onChange={e => {
                      this.onEntryChange(index, e);
                    }}
                    onBlur={this.updateMap}
                    onRemove={this.onEntryRemove}
                  />
                ))}
              </div>
              <Button variant="secondary" icon="plus" onClick={this.onEntryAdd}>
                Add entry
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
}
