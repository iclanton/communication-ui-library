// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { useEffect } from 'react';
import { _formatString } from '@internal/acs-ui-common';
import { Parser, ProcessNodeDefinitions, IsValidNodeDefinitions } from 'html-to-react';

import Linkify from 'react-linkify';
import { ChatMessage } from '../../types/ChatMessage';
/* @conditional-compile-remove(data-loss-prevention) */
import { BlockedMessage } from '../../types/ChatMessage';
import { Link } from '@fluentui/react';
/* @conditional-compile-remove(mention) */
import { MentionDisplayOptions, Mention } from '../MentionPopover';

/* @conditional-compile-remove(data-loss-prevention) */
import { FontIcon, Stack } from '@fluentui/react';
import { MessageThreadStrings } from '../MessageThread';
import { AttachmentMetadata, InlineImageMetadata } from '../FileDownloadCards';
import LiveMessage from '../Announcer/LiveMessage';
/* @conditional-compile-remove(mention) */
import { defaultOnMentionRender } from './MentionRenderer';
import DOMPurify from 'dompurify';

type ChatMessageContentProps = {
  message: ChatMessage;
  strings: MessageThreadStrings;
  /* @conditional-compile-remove(mention) */
  mentionDisplayOptions?: MentionDisplayOptions;
  attachmentsMap?: Record<string, string>;
  onFetchAttachments?: (attachments: AttachmentMetadata[], messageId: string) => Promise<void>;
  onInlineImageClicked?: (attachmentId: string) => void;
};

/* @conditional-compile-remove(data-loss-prevention) */
type BlockedMessageContentProps = {
  message: BlockedMessage;
  strings: MessageThreadStrings;
};

// Missing from html-to-react.
type ProcessingInstructionType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shouldProcessNode: (node: any) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processNode: (node: any, children: any, index: number) => unknown;
};

type MessageContentWithLiveAriaProps = {
  message: ChatMessage | /* @conditional-compile-remove(data-loss-prevention) */ BlockedMessage;
  liveMessage: string;
  ariaLabel?: string;
  content: JSX.Element;
};

/** @private */
export const ChatMessageContent = (props: ChatMessageContentProps): JSX.Element => {
  switch (props.message.contentType) {
    case 'text':
      return MessageContentAsText(props);
    case 'html':
      return MessageContentAsRichTextHTML(props);
    case 'richtext/html':
      return MessageContentAsRichTextHTML(props);
    default:
      console.warn('unknown message content type');
      return <></>;
  }
};

const MessageContentWithLiveAria = (props: MessageContentWithLiveAriaProps): JSX.Element => {
  return (
    <div data-ui-status={props.message.status} role="text" aria-label={props.ariaLabel}>
      <LiveMessage message={props.liveMessage} ariaLive="polite" />
      {props.content}
    </div>
  );
};

const MessageContentAsRichTextHTML = (props: ChatMessageContentProps): JSX.Element => {
  const { message, attachmentsMap, onFetchAttachments } = props;
  useEffect(() => {
    if (!attachmentsMap || !onFetchAttachments) {
      return;
    }
    const attachments = message.inlineImages?.filter((inlinedImages) => {
      return attachmentsMap[inlinedImages.id] === undefined;
    });
    if (attachments && attachments.length > 0) {
      onFetchAttachments(attachments, message.messageId);
    }
  }, [message.inlineImages, message.messageId, onFetchAttachments, attachmentsMap]);

  return (
    <MessageContentWithLiveAria
      message={props.message}
      liveMessage={generateLiveMessage(props)}
      ariaLabel={messageContentAriaText(props)}
      content={processHtmlToReact(props)}
    />
  );
};

const MessageContentAsText = (props: ChatMessageContentProps): JSX.Element => {
  return (
    <MessageContentWithLiveAria
      message={props.message}
      liveMessage={generateLiveMessage(props)}
      ariaLabel={messageContentAriaText(props)}
      content={
        <Linkify
          componentDecorator={(decoratedHref: string, decoratedText: string, key: number) => {
            return (
              <Link target="_blank" href={decoratedHref} key={key}>
                {decoratedText}
              </Link>
            );
          }}
        >
          {props.message.content}
        </Linkify>
      }
    />
  );
};

/* @conditional-compile-remove(data-loss-prevention) */
/**
 * @private
 */
export const BlockedMessageContent = (props: BlockedMessageContentProps): JSX.Element => {
  const Icon: JSX.Element = <FontIcon iconName={'DataLossPreventionProhibited'} />;
  const blockedMessage =
    props.message.warningText === undefined ? props.strings.blockedWarningText : props.message.warningText;
  const blockedMessageLink = props.message.link;
  const blockedMessageLinkText = blockedMessageLink
    ? props.message.linkText ?? props.strings.blockedWarningLinkText
    : '';

  const liveAuthor =
    props.message.mine || props.message.senderDisplayName === undefined ? '' : props.message.senderDisplayName;
  const liveBlockedWarningText = `${liveAuthor} ${blockedMessage} ${blockedMessageLinkText}`;
  return (
    <MessageContentWithLiveAria
      message={props.message}
      liveMessage={liveBlockedWarningText}
      ariaLabel={liveBlockedWarningText}
      content={
        <Stack horizontal wrap>
          {Icon}
          {blockedMessage && <p>{blockedMessage}</p>}
          {blockedMessageLink && (
            <Link target={'_blank'} href={blockedMessageLink}>
              {blockedMessageLinkText}
            </Link>
          )}
        </Stack>
      }
    />
  );
};

// https://stackoverflow.com/questions/28899298/extract-the-text-out-of-html-string-using-javascript
const extractContent = (s: string): string => {
  const span = document.createElement('span');
  span.innerHTML = s;
  return span.textContent || span.innerText;
};

const generateLiveMessage = (props: ChatMessageContentProps): string => {
  const liveAuthor = _formatString(props.strings.liveAuthorIntro, { author: `${props.message.senderDisplayName}` });

  return `${props.message.editedOn ? props.strings.editedTag : ''} ${
    props.message.mine ? '' : liveAuthor
  } ${extractContent(props.message.content || '')} `;
};

const messageContentAriaText = (props: ChatMessageContentProps): string | undefined => {
  // Strip all html tags from the content for aria.

  return props.message.content
    ? props.message.mine
      ? _formatString(props.strings.messageContentMineAriaText, {
          message: DOMPurify.sanitize(props.message.content, { ALLOWED_TAGS: [] })
        })
      : _formatString(props.strings.messageContentAriaText, {
          author: `${props.message.senderDisplayName}`,
          message: DOMPurify.sanitize(props.message.content, { ALLOWED_TAGS: [] })
        })
    : undefined;
};

const processNodeDefinitions = ProcessNodeDefinitions();
const htmlToReactParser = Parser();

const processInlineImage = (props: ChatMessageContentProps): ProcessingInstructionType => ({
  // Custom <img> processing
  shouldProcessNode: (node): boolean => {
    function matchingImageNode(imageMetadata: InlineImageMetadata): boolean {
      return imageMetadata.id === node.attribs.id;
    }

    // Process img node with id in attachments list
    return (
      node.name &&
      node.name === 'img' &&
      node.attribs &&
      node.attribs.id &&
      props.message.inlineImages?.find(matchingImageNode)
    );
  },
  processNode: (node, children, index): JSX.Element => {
    node.attribs = { ...node.attribs, 'aria-label': node.attribs.name };
    // logic to check id in map/list
    if (props.attachmentsMap && node.attribs.id in props.attachmentsMap) {
      node.attribs = { ...node.attribs, src: props.attachmentsMap[node.attribs.id] };
    }
    const handleOnClick = (): void => {
      props.onInlineImageClicked && props.onInlineImageClicked(node.attribs.id);
    };

    return (
      <span
        data-ui-id={node.attribs.id}
        onClick={handleOnClick}
        tabIndex={0}
        role="button"
        style={{
          cursor: 'pointer'
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleOnClick();
          }
        }}
      >
        {processNodeDefinitions.processDefaultNode(node, children, index)}
      </span>
    );
    return processNodeDefinitions.processDefaultNode(node, children, index);
  }
});

/* @conditional-compile-remove(mention) */
const processMention = (props: ChatMessageContentProps): ProcessingInstructionType => ({
  shouldProcessNode: (node) => {
    if (props.mentionDisplayOptions?.onRenderMention) {
      // Override the handling of the <msft-mention> tag in the HTML if there's a custom renderer
      return node.name === 'msft-mention';
    }
    return false;
  },
  processNode: (node) => {
    if (props.mentionDisplayOptions?.onRenderMention) {
      const { id } = node.attribs;
      const mention: Mention = {
        id: id,
        displayText: node.children[0]?.data ?? ''
      };
      return props.mentionDisplayOptions.onRenderMention(mention, defaultOnMentionRender);
    }
    return processNodeDefinitions.processDefaultNode;
  }
});

const processHtmlToReact = (props: ChatMessageContentProps): JSX.Element => {
  const steps: ProcessingInstructionType[] = [
    processInlineImage(props),
    /* @conditional-compile-remove(mention) */
    processMention(props),
    {
      // Process everything else in the default way
      shouldProcessNode: IsValidNodeDefinitions.alwaysValid,
      processNode: processNodeDefinitions.processDefaultNode
    }
  ];

  return htmlToReactParser.parseWithInstructions(
    props.message.content ?? '',
    IsValidNodeDefinitions.alwaysValid,
    steps
  );
};
