# Glossary

## Applicative Validation

An error-handling strategy that validates all command-line parameters or form
inputs simultaneously, accumulating every constraint violation into a list or
array rather than terminating upon encountering the first failure.

## Command-Line Action

A discriminated algebraic data variant representing the pure outcome of
evaluating command-line arguments (such as displaying help, printing the
version, emitting diagnostics with an exit code, or executing a puzzle solve),
decoupled from console and stream I/O.

## Dictionary

A line-delimited text source providing candidate words evaluated against a
puzzle.

## Dictionary Filtering

The process of normalising and filtering a raw system word list into candidate
words. A utility script enforces these criteria: words must only contain
lowercase alphabetic characters and have a minimum length of four. Roman
numerals, hyphenated words, uppercase proper nouns, and numbers are excluded.

## Letter Pool

The set of allowed characters for the puzzle, consisting of between four and
nine unique lowercase ASCII characters (`a`–`z`).

_Avoid_: alphabet, character set

## Mandatory Letter

The specific character that must be present in every valid matching word. In
the command-line interface, this character is implicitly derived from the first
character of the letter pool; in the web interface, it is entered as a separate
field and prepended to the other letters.

_Avoid_: centre letter, key letter

## Nine Letters

A word puzzle mode where words are constrained to a maximum length of nine
characters, and each character in the letter pool may appear at most once. This
is the default mode in the command-line interface when repeats are not enabled.

## Other Letters

The secondary characters that complete the letter pool when combined with the
mandatory letter. In the web interface, between three and eight unique
lowercase ASCII characters must be supplied, disjoint from the mandatory
letter.

_Avoid_: secondary letters, additional letters

## Puzzle

The central domain model representing the configuration and rules of a word
puzzle, comprising a minimum word size, mandatory letter, letter pool,
dictionary path, and repeat mode flag.

## Repeats

A puzzle mode (such as the NYT Spelling Bee) where letters from the letter pool
may be used multiple times within a single word, and where no upper bound is
enforced on word length. This is the default mode in the web interface.

_Avoid_: Spelling Bee mode

## Solver

The pure matching mechanism that evaluates dictionary candidate words against
puzzle constraints to yield matching words. The solver is decoupled from file
system access, network loading, and user interface rendering.

## Valid Word

A candidate word from the dictionary that satisfies all puzzle constraints and
invariants, represented in the domain model as a branded string nominal type.

_Avoid_: matching word, solution word

## Validation Error

A domain data variant representing a specific configuration, command-line
argument, or form input failure, such as an out-of-range word size, missing
mandatory letter, or invalid letter pool.

## Word Chip

An accessible visual badge representing an individual valid word in the web
interface, featuring bold primary colour highlighting for each occurrence of
the mandatory letter.

_Avoid_: word pill, result tag

## Word Group

A collection of valid words sharing an identical character length, presented
within a dedicated card container in the web interface. Groups are ordered by
descending word length, with words sorted alphabetically within each group.

_Avoid_: length bucket, length section

## Word Size

The minimum length constraint for a valid solution word, bounded between four
and nine inclusive.
