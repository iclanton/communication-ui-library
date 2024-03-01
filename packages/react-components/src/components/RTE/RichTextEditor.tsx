// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { ContentEdit, Watermark } from 'roosterjs-editor-plugins';
import { Editor } from 'roosterjs-editor-core';
import type { EditorOptions, IEditor } from 'roosterjs-editor-types-compatible';
import { Rooster, createUpdateContentPlugin, UpdateMode, createRibbonPlugin, Ribbon } from 'roosterjs-react';
import {
  ribbonButtonStyle,
  ribbonOverflowButtonStyle,
  ribbonStyle,
  richTextEditorStyle
} from '../styles/RichTextEditor.styles';
import { useTheme } from '../../theming';
import { ribbonButtons, ribbonButtonsStrings } from './RTERibbonButtons';
import { RichTextSendBoxStrings } from './RTESendBox';
import { isDarkThemed } from '../../theming/themeUtils';
import { setBackgroundColor, setTextColor } from 'roosterjs-editor-api';

/**
 * Props for {@link RichTextEditor}.
 *
 * @beta
 */
export interface RichTextEditorProps {
  initialContent?: string;
  onChange: (newValue?: string) => void;
  placeholderText?: string;
  strings: Partial<RichTextSendBoxStrings>;
}

/**
 * Props for {@link RichTextEditor}.
 *
 * @beta
 */
export interface RichTextEditorComponentRef {
  focus: () => void;
}

/**
 * A component to wrap RoosterJS Rich Text Editor.
 *
 * @beta
 */
export const RichTextEditor = React.forwardRef<RichTextEditorComponentRef, RichTextEditorProps>((props, ref) => {
  const { initialContent, onChange, placeholderText, strings } = props;
  const editor = useRef<IEditor | null>(null);
  const theme = useTheme();
  useImperativeHandle(
    ref,
    () => {
      return {
        focus() {
          if (editor.current) {
            editor.current.focus();
          }
        }
      };
    },
    []
  );

  useEffect(() => {
    if (editor.current !== null) {
      // Adjust color prop for the div component when theme is updated
      // because doNotAdjustEditorColor is set for Rooster
      setTextColor(editor.current, theme.palette.neutralPrimary);
    }
  }, [theme]);

  const ribbonPlugin = React.useMemo(() => {
    return createRibbonPlugin();
  }, []);

  const editorCreator = useCallback((div: HTMLDivElement, options: EditorOptions) => {
    editor.current = new Editor(div, options);
    // Remove the background color of the editor
    setBackgroundColor(editor.current, 'transparent');
    return editor.current;
  }, []);

  const plugins = useMemo(() => {
    const contentEdit = new ContentEdit();
    const placeholderPlugin = new Watermark(placeholderText || '');
    const updateContentPlugin = createUpdateContentPlugin(
      UpdateMode.OnContentChangedEvent | UpdateMode.OnUserInput,
      (content: string) => {
        onChange && onChange(content);
      }
    );
    return [contentEdit, placeholderPlugin, updateContentPlugin, ribbonPlugin];
  }, [onChange, placeholderText, ribbonPlugin]);

  const ribbon = useMemo(() => {
    const buttons = ribbonButtons(theme);

    return (
      //TODO: Add localization for watermark plugin https://github.com/microsoft/roosterjs/issues/2430
      <Ribbon
        styles={ribbonStyle()}
        buttons={buttons}
        plugin={ribbonPlugin}
        overflowButtonProps={{
          styles: ribbonButtonStyle(theme),
          menuProps: {
            items: [], // CommandBar will determine items rendered in overflow
            isBeakVisible: false,
            styles: ribbonOverflowButtonStyle(theme)
          }
        }}
        strings={ribbonButtonsStrings(strings)}
      />
    );
  }, [strings, ribbonPlugin, theme]);

  return (
    <div>
      {ribbon}
      <Rooster
        initialContent={initialContent}
        inDarkMode={isDarkThemed(theme)}
        plugins={plugins}
        className={richTextEditorStyle}
        editorCreator={editorCreator}
        // TODO: confirm the color during inline images implementation
        imageSelectionBorderColor={'blue'}
        // doNotAdjustEditorColor is used to fix the default background color for Rooster component
        doNotAdjustEditorColor={true}
      />
    </div>
  );
});
