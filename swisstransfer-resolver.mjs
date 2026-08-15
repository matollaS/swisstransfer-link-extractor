const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

export class SwissTransferResolveError extends Error {}

function extractTransferId(shareUrl) {
  if (!shareUrl) return null;
  const m = shareUrl.match(/\/(?:d|dl)\/([a-zA-Z0-9-]+)/);
  if (m) return m[1];
  const trimmed = shareUrl.trim();
  if (/^[a-zA-Z0-9-]{8,}$/.test(trimmed)) return trimmed;
  return null;
}

function authHeaders(password) {
  const headers = { 'User-Agent': USER_AGENT, 'Accept': 'application/json, text/plain, */*' };
  if (password) headers['Authorization'] = Buffer.from(password, 'utf8').toString('base64');
  return headers;
}

async function getLinkDetails(transferId, password) {
  const res = await fetch(`https://www.swisstransfer.com/api/1/links/${transferId}?with=transfer`, {
    headers: authHeaders(password),
  });

  if (res.status === 401 || res.status === 403) {
    throw new SwissTransferResolveError(
      'This transfer requires a password or the provided password was incorrect.'
    );
  }
  if (!res.ok) {
    throw new SwissTransferResolveError(
      `Could not retrieve SwissTransfer link (HTTP ${res.status}). The transfer may have expired or been deleted.`
    );
  }

  const data = await res.json();
  const transfer = data?.data?.transfer;
  const files = transfer?.files;

  if (!files?.length) {
    throw new SwissTransferResolveError(
      'No files found in this transfer or SwissTransfer API format changed.'
    );
  }

  return { transfer, files };
}

async function getDownloadUrl(transferId, fileId, password) {
  const res = await fetch(
    `https://www.swisstransfer.com/api/1/links/${transferId}/files/${fileId}`,
    { headers: authHeaders(password) }
  );

  if (!res.ok) {
    throw new SwissTransferResolveError(
      `Failed to generate direct download URL (HTTP ${res.status}).`
    );
  }

  const data = await res.json();
  const url = data?.data?.url;
  if (!url) throw new SwissTransferResolveError('Empty download URL returned by SwissTransfer.');
  return url;
}

/**
 * Resolves a SwissTransfer link into direct, tokenized S3 download URLs.
 *
 * @param {string} shareUrl
 * @param {string|null} [password]
 * @returns {Promise<{
 *   transferId: string,
 *   sender: string|null,
 *   totalSize: number,
 *   createdAt: number|null,
 *   expiresAt: number|null,
 *   files: Array<{id: string, fileName: string, size: number, mimeType: string, url: string}>
 * }>}
 */
export async function resolveSwissTransfer(shareUrl, password = null) {
  const transferId = extractTransferId(shareUrl);
  if (!transferId) {
    throw new SwissTransferResolveError('Invalid SwissTransfer URL or Transfer ID.');
  }

  const { transfer, files } = await getLinkDetails(transferId, password);

  const resolvedFiles = [];
  for (const file of files) {
    const url = await getDownloadUrl(transferId, file.id, password);
    resolvedFiles.push({
      id: file.id,
      fileName: file.path || file.name || 'file',
      size: Number(file.size ?? 0),
      mimeType: file.mime_type || 'application/octet-stream',
      url,
    });
  }

  return {
    transferId,
    sender: transfer.sender || null,
    totalSize: Number(transfer.total_size || 0),
    createdAt: transfer.created_at || null,
    expiresAt: transfer.expires_at || null,
    files: resolvedFiles,
  };
}
