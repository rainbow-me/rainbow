import { format } from 'date-fns';
import { capitalize } from 'lodash';

import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import * as i18n from '@/languages';
import { type Contact } from '@/redux/contacts';

import { thisMonthTimestamp, thisYearTimestamp, todayTimestamp, yesterdayTimestamp } from './transactions';

// ============ Types ========================================================== //

/** Transaction row data type with embedded contact information. */
export type RainbowTransactionWithContact = RainbowTransaction & { contact: Contact | null };

/** Renderable activity list section with grouped transaction rows. */
export type TransactionSection = { title: string; data: RainbowTransactionWithContact[] };

enum SectionRank {
  Pending = 0,
  Today = 1,
  Yesterday = 2,
  ThisMonth = 3,
  Month = 4,
}

type ConfirmedSectionRank = Exclude<SectionRank, SectionRank.Pending>;
type TransactionSectionBucket = TransactionSection & { newestTimestampMs: number; rank: SectionRank };

// ============ Constants ====================================================== //

const EMPTY_TRANSACTION_SECTIONS: TransactionSection[] = [];

// ============ Section Builder ================================================ //

/**
 * Builds chronological sections from transactions and contacts.
 */
export function buildTransactionsSections({
  contacts,
  transactions,
}: {
  contacts: { [address: string]: Contact };
  transactions: RainbowTransaction[];
}): TransactionSection[] {
  if (!transactions.length) return EMPTY_TRANSACTION_SECTIONS;

  const sectionBuckets: TransactionSectionBucket[] = [];
  const sectionsByTitle: { [title: string]: TransactionSectionBucket | undefined } = {};

  for (const transaction of transactions) {
    const timestampMs = transactionTimestampMs(transaction);
    let newestTimestampMs = timestampMs ?? 0;
    let rank = SectionRank.Pending;
    let title: string;

    if (transaction.status === TransactionStatus.pending) {
      title = i18n.t(i18n.l.transactions.pending_title);
    } else {
      if (timestampMs === null) continue;
      newestTimestampMs = timestampMs;

      const confirmedRank = confirmedSectionRank(timestampMs);
      const confirmedTitle = confirmedSectionTitle(confirmedRank, timestampMs);
      if (confirmedTitle === null) continue;

      rank = confirmedRank;
      title = confirmedTitle;
    }

    const sectionTransaction = buildSectionTransaction(contacts, transaction);
    const existingSection = sectionsByTitle[title];

    if (existingSection) {
      existingSection.data.push(sectionTransaction);
      existingSection.newestTimestampMs = Math.max(existingSection.newestTimestampMs, newestTimestampMs);
    } else {
      const nextSection = { data: [sectionTransaction], newestTimestampMs, rank, title };
      sectionsByTitle[title] = nextSection;
      sectionBuckets.push(nextSection);
    }
  }

  if (!sectionBuckets.length) return EMPTY_TRANSACTION_SECTIONS;

  for (const section of sectionBuckets) section.data.sort(byNewestFirst);
  return sectionBuckets.sort(compareTransactionSections);
}

// ============ Section Metadata =============================================== //

function transactionTimestampMs(transaction: Pick<RainbowTransaction, 'minedAt' | 'timestamp'>): number | null {
  if (typeof transaction.minedAt === 'number') return transaction.minedAt * 1000;
  if (typeof transaction.timestamp === 'number') return transaction.timestamp;
  return null;
}

function confirmedSectionRank(timestampMs: number): ConfirmedSectionRank {
  if (timestampMs > todayTimestamp) return SectionRank.Today;
  if (timestampMs > yesterdayTimestamp) return SectionRank.Yesterday;
  if (timestampMs > thisMonthTimestamp) return SectionRank.ThisMonth;
  return SectionRank.Month;
}

function confirmedSectionTitle(rank: ConfirmedSectionRank, timestampMs: number): string | null {
  if (rank === SectionRank.Today) return i18n.t(i18n.l.time.today_caps);
  if (rank === SectionRank.Yesterday) return i18n.t(i18n.l.time.yesterday_caps);
  if (rank === SectionRank.ThisMonth) return i18n.t(i18n.l.time.this_month_caps);

  try {
    return capitalize(
      format(timestampMs, `MMMM${timestampMs > thisYearTimestamp ? '' : ' yyyy'}`, {
        locale: i18n.getDateFnsLocale(),
      })
    );
  } catch {
    return null;
  }
}

// ============ Helpers ======================================================== //

function buildSectionTransaction(contacts: { [address: string]: Contact }, transaction: RainbowTransaction): RainbowTransactionWithContact {
  const from = transaction.from ?? '';
  const to = transaction.to ?? '';

  const isSent = transaction.type === 'send' && transaction.status === TransactionStatus.confirmed;
  const contactAddress = isSent ? to : from;
  const contact = contacts[contactAddress.toLowerCase()] ?? null;

  return { ...transaction, contact, from, to };
}

function byNewestFirst(first: RainbowTransactionWithContact, second: RainbowTransactionWithContact): number {
  return (transactionTimestampMs(second) ?? 0) - (transactionTimestampMs(first) ?? 0);
}

function compareTransactionSections(first: TransactionSectionBucket, second: TransactionSectionBucket): number {
  const rankDifference = first.rank - second.rank;
  return rankDifference || second.newestTimestampMs - first.newestTimestampMs;
}
