
class TimeoutError extends Error {};
class MalformedMessageError extends Error {};
class UnexpectedHttpResponse extends Error {};

module.exports = {
    TimeoutError,
    MalformedMessageError,
    UnexpectedHttpResponse,
};