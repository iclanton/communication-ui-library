// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AttachmentMetadataInProgress, RichTextSendBox as RichTextSendBoxComponent } from '@azure/communication-react';
import { Title, Description, Props, Heading, Canvas, Source } from '@storybook/addon-docs';
import { Meta } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import { DetailedBetaBanner } from '../BetaBanners/DetailedBetaBanner';
import { SingleLineBetaBanner } from '../BetaBanners/SingleLineBetaBanner';
import { COMPONENT_FOLDER_PREFIX } from '../constants';
import { hiddenControl, controlsToAdd } from '../controlsUtils';
import { RichTextSendBoxExample } from './snippets/RichTextSendBox.snippet';
import { RichTextSendBoxAttachmentUploadsExample } from './snippets/RichTextSendBoxAttachmentUploads.snippet';
import { RichTextSendBoxOnPasteCallbackExample } from './snippets/RichTextSendBoxOnPasteCallback.snippet';
import { RichTextSendBoxWithInlineImagesExample } from './snippets/RichTextSendBoxWithInlineImages.snippet';
import { RichTextSendBoxWithSystemMessageExample } from './snippets/RichTextSendBoxWithSystemMessage.snippet';

const RichTextSendBoxExampleText = require('!!raw-loader!./snippets/RichTextSendBox.snippet.tsx').default;
const RichTextSendBoxAttachmentUploadsExampleText =
  require('!!raw-loader!./snippets/RichTextSendBoxAttachmentUploads.snippet.tsx').default;
const RichTextSendBoxOnPasteCallbackExampleText =
  require('!!raw-loader!./snippets/RichTextSendBoxOnPasteCallback.snippet.tsx').default;
const RichTextSendBoxWithInlineImagesExampleText =
  require('!!raw-loader!./snippets/RichTextSendBoxWithInlineImages.snippet.tsx').default;
const RichTextSendBoxWithSystemMessageExampleText =
  require('!!raw-loader!./snippets/RichTextSendBoxWithSystemMessage.snippet.tsx').default;

const importStatement = `import { RichTextSendBox } from '@azure/communication-react';`;

const getDocs: () => JSX.Element = () => {
  return (
    <>
      <SingleLineBetaBanner topOfPage={true} />
      <Title>RichTextSendBox</Title>
      <Description>
        Component for composing messages with rich text formatting. RichTextSendBox has a callback for sending typing
        notification when user starts entering text. It also supports an optional message above the rich text editor.
      </Description>

      <Heading>Importing</Heading>
      <Source code={importStatement} />

      <Heading>Example</Heading>
      <Canvas mdxSource={RichTextSendBoxExampleText}>
        <RichTextSendBoxExample />
      </Canvas>

      <Heading>Add a system message</Heading>
      <Description>To add a system message, use the systemMessage property like in the example below.</Description>
      <Canvas mdxSource={RichTextSendBoxWithSystemMessageExampleText}>
        <RichTextSendBoxWithSystemMessageExample />
      </Canvas>

      <Heading>Display File Uploads</Heading>
      <DetailedBetaBanner />
      <Description>
        RichTextSendBox component provides UI for displaying AttachmentMetadataInProgress in the RichTextSendBox. This
        allows developers to implement a file sharing feature using the pure UI component with minimal effort.
        Developers can write their own attachment upload logic and utilize the UI provided by RichTextSendBox.
      </Description>
      <Canvas mdxSource={RichTextSendBoxAttachmentUploadsExampleText}>
        <RichTextSendBoxAttachmentUploadsExample />
      </Canvas>

      <Heading>Enable Inserting Inline Images</Heading>
      <Description>
        The RichTextSendBox component provides an `onInsertInlineImage` callback to handle an inline image that is
        inserted into the RichTextSendBox component. This callback can be used to implement custom logic, such as
        uploading the image to a server. After processing each inserted image in the callback, the results should be
        passed back to the component through the `inlineImages` prop. This prop will be used to render inline images in
        the RichTextSendBox and send them with the message.
      </Description>
      <Canvas mdxSource={RichTextSendBoxWithInlineImagesExampleText}>
        <RichTextSendBoxWithInlineImagesExample />
      </Canvas>

      <Heading>Process pasted content</Heading>
      <Description>
        RichTextSendBox provides `onPaste` callback for custom processing of the pasted content before it's inserted
        into the RichTextSendBox. This callback can be used to implement custom paste handling logic tailored to your
        application's needs. The example below shows how to remove images from pasted content.
      </Description>
      <Canvas mdxSource={RichTextSendBoxOnPasteCallbackExampleText}>
        <RichTextSendBoxOnPasteCallbackExample />
      </Canvas>

      <Heading>Props</Heading>
      <Props of={RichTextSendBoxComponent} />
    </>
  );
};

const RichTextSendBoxStory = (args): JSX.Element => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const delayForSendButton = 300;
  const [inlineImages, setInlineImages] = useState<AttachmentMetadataInProgress[] | undefined>();

  return (
    <div style={{ width: '31.25rem', maxWidth: '90%' }}>
      <RichTextSendBoxComponent
        disabled={args.disabled}
        attachments={
          args.hasAttachments
            ? [
                {
                  id: 'f2d1fce73c98',
                  name: 'file1.txt',
                  url: 'https://www.contoso.com/file1.txt',
                  progress: 1
                },
                {
                  id: 'dc3a33ebd321',
                  name: 'file2.docx',
                  url: 'https://www.contoso.com/file2.txt',
                  progress: 1
                }
              ]
            : undefined
        }
        systemMessage={args.hasWarning ? args.warningMessage : undefined}
        onSendMessage={async (message, options) => {
          timeoutRef.current = setTimeout(() => {
            setInlineImages(undefined);
            alert(`sent message: ${message} with options ${JSON.stringify(options)}`);
          }, delayForSendButton);
        }}
        onCancelAttachmentUpload={(attachmentId) => {
          window.alert(`requested to cancel attachment upload for attachment with id: "${attachmentId}"`);
        }}
        onTyping={(): Promise<void> => {
          console.log(`sending typing notifications`);
          return Promise.resolve();
        }}
        onInsertInlineImage={(image: string, fileName: string) => {
          const id = inlineImages?.length ? (inlineImages.length + 1).toString() : '1';
          const newImage = {
            id,
            name: fileName,
            progress: 1,
            url: image,
            error: undefined
          };
          setInlineImages([...(inlineImages ?? []), newImage]);
        }}
        inlineImages={inlineImages}
        onCancelInlineImageUpload={(imageId: string) => {
          const filteredInlineImages = inlineImages?.filter((image) => image.id !== imageId);
          setInlineImages(filteredInlineImages);
        }}
      />
    </div>
  );
};

// This must be the only named export from this module, and must be named to match the storybook path suffix.
// This ensures that storybook hoists the story instead of creating a folder with a single entry.
export const RichTextSendBox = RichTextSendBoxStory.bind({});

export default {
  id: `${COMPONENT_FOLDER_PREFIX}-richtextsendbox`,
  title: `${COMPONENT_FOLDER_PREFIX}/Send Box/Rich Text Send Box`,
  component: RichTextSendBoxComponent,
  argTypes: {
    disabled: controlsToAdd.disabled,
    hasWarning: controlsToAdd.isSendBoxWithWarning,
    hasAttachments: controlsToAdd.isSendBoxWithAttachments,
    warningMessage: controlsToAdd.sendBoxWarningMessage,
    strings: hiddenControl,
    onRenderAttachmentUploads: hiddenControl,
    attachments: hiddenControl,
    onCancelAttachmentUpload: hiddenControl,
    onSendMessage: hiddenControl,
    onTyping: hiddenControl,
    onPaste: hiddenControl
  },
  parameters: {
    docs: {
      page: () => getDocs()
    }
  }
} as Meta;
