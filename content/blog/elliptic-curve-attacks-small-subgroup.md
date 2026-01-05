---
title: "Elliptic curve attacks - from small subgroup attack to invalid curve attack"
slug: "elliptic-curve-attacks-small-subgroup"
excerpt: "How missing public-key validation in ECDH enables small-subgroup and invalid-curve attacks, and what robust defenses look like."
author: "ret2basic.eth"
date: "2024-04-12"
readTime: "30 min read"
category: "Cryptography"
tags: ["Elliptic Curves", "Cryptography"]
featured: false
image: "/images/blog/elliptic-curve-attacks.jpg"
---

When auditing elliptic curve libraries—especially **ECDH**-related code—double-check whether the implementation performs sufficient validation on points received from untrusted peers. If not, an attacker can send crafted points and (with the right kind of oracle) recover the server's private key in the worst case.

There is a well-known attack called the **small-subgroup attack**. The attacker sends a point from a subgroup of *small order* (e.g., order 2, 4, or 8). Because the subgroup is tiny, the ECDH shared secret computed from that point has only a handful of possibilities and can be brute-forced. Repeating with different small subgroups can reveal the victim's private key modulo small factors. Defenses include subgroup membership checks and using curves with cofactor 1.

Another (related) attack is the **invalid-curve attack**. It builds on the same idea, but the attacker chooses points that are *not even on the intended curve* (often on twists or related curves). The victim computes scalar multiplication anyway, and the attacker learns congruences about the private key. With enough congruences, the private key can be reconstructed using the Chinese Remainder Theorem. The key defense is to verify that the incoming point satisfies the intended curve equation (and, for cofactor $> 1$ curves, also enforce subgroup membership).

I am writing this article because I found that many existing resources don't explain the details (especially the math) clearly. Therefore, I will try to make every step explicit.

### Threat model (why the attacker can learn anything)

Both attacks need a way for the attacker to *distinguish* which candidate shared secret was used. In practice this typically comes from one of the following:

- The implementation directly uses some representation of $S$ as a symmetric key.
- The protocol provides an explicit key confirmation step.
- The victim decrypts/authenticates attacker-controlled ciphertext and reveals success/failure (even indirectly via timing, error messages, or parsing behavior).

If the protocol is designed so that an attacker cannot observe any signal that depends on the derived key, then “brute-forcing the tiny subgroup” does not immediately translate into a private-key recovery.

### What the oracle looks like in real systems

In applied cryptography, the “oracle” is rarely an explicit API like `is_key_correct()`. It tends to show up as one of these patterns:

- **Decrypt-then-parse**: the server decrypts attacker-controlled ciphertext and the attacker can tell whether the plaintext “made sense” (JSON parse succeeds, protobuf decode succeeds, etc.).
- **MAC/AEAD verification**: the server checks a MAC/tag derived from the ECDH key and reveals success/failure (even if only as a generic error code or timing difference).
- **Key confirmation / handshake transcripts**: the protocol includes a message whose validity depends on the derived key (many handshake designs do).
- **Application-level behavior**: e.g., different response size, different latency, different error logs, or conditional side effects.

The important point is: ECDH itself is just math, but *protocol glue* can easily expose a key-dependent signal.

## Some (sub)group theory: Lagrange's theorem and Cauchy's theorem

We will need some group theory results to understand why small-subgroup and invalid-curve attacks work. This part is missing from most of the articles / CTF writeups on the Internet, so pay attention. We are going to cover two theorems regarding subgroups: Lagrange's theorem and Cauchy's theorem.

**Lagrange's theorem:**

![Lagrange's theorem](/images/blog/Lagrange's%20Theorem.png)

**Reference:** [http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html](http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html)

Here is a short intro to cosets and Lagrange's theorem on [Youtube](https://youtu.be/TCcSZEL_3CQ?si=Gkd_nBL83jnqfqhA). Basically, the theorem says: if $H$ is a subgroup of $G$, then $|H|$ divides $|G|$. For example, if $|G| = 12$, then the only **possible subgroup orders** are 1, 2, 3, 4, 6, and 12. Excluding the trivial subgroup $\{e\}$ and $G$ itself, the non-trivial subgroup orders are 2, 3, 4, and 6. Note this does not mean there are only four non-trivial subgroups; multiple subgroups with the same order can exist.

One way to understand why this is true is via cosets: cosets partition the group $G$ and all cosets have the same size. Each coset $gH$ has the same size as $H$. Visually, you can think of $G$ as a chocolate bar and each coset as a chunk. Because the cosets are disjoint and cover $G$, we have $|G| = (\#\text{cosets}) \cdot |H|$, so $|H|$ divides $|G|.

Lagrange's theorem has two important corollaries:

![Lagrange's Theorem corollaries](/images/blog/Lagrange's%20Theorem%20corollary.png)

**Reference:** [http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html](http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html)

The first corollary is very easy to understand. The second corollary says: any group with prime order $p$ is cyclic, and any element other than the identity is a generator. Elliptic curves over finite fields form finite abelian groups, so these corollaries apply. In particular, the order of any point divides the order of the curve group, and if the curve group has prime order then every non-identity point generates the group.

**These two corollaries are important results, keep that in mind, we will use them a lot when studying elliptic curves.**

Important: Lagrange's theorem is an **if-then theorem**. It does not guarantee the existence of a subgroup of a particular order. Equivalently, the reverse is false in general: even if $d$ divides $|G|$, a subgroup of order $d$ might not exist. A useful partial converse is given by Cauchy's theorem for prime divisors.

**Cauchy's theorem:**

![Cauchy's Theorem](/images/blog/Cauchy's%20Theorem.png)

**Reference:** [http://abstract.ups.edu/aata/sylow-section-sylow-theorems.html](http://abstract.ups.edu/aata/sylow-section-sylow-theorems.html)

For example, say group $G$ has order 6. We can factor 6 into prime decomposition: $6 = 2 \cdot 3$. Cauchy's theorem guarantees that subgroups with order 2 and 3 exist. In summary, Lagrange's theorem tells you what subgroup orders are possible, and Cauchy's theorem tells you that subgroups of prime order (for primes dividing $|G|$) actually exist.

Recall the second corollary of Lagrange's theorem says any group of prime order is cyclic, and any element other than identity is a generator. Combining it with Cauchy's theorem, the prime-order subgroups we get are all cyclic, and any (non-trivial) element in the subgroup is a generator. Recall that the first corollary of Lagrange's theorem says the order of an element in a group divides the order of the group. Since we are working with prime-order subgroups, it is easy to see that the order of an element is either 1 or $p$, where $p$ is the order of the prime-order subgroup. The order-1 case corresponds to the identity element, so we can conclude that if a prime-order subgroup has order $p$, then any non-trivial element in it has order $p$ as well.

You might ask, why bother studying subgroups though? Abstractly, think of taking subgroup as reducing a big problem to a small one. In the two attacks we are going to talk about next, you will see how taking subgroups converts a hard problem into easy problem (computationally).

## Understanding Elliptic Curve Diffie-Hellman (ECDH)

ECDH is like traditional Diffie-Hellman (DH), but replaces the original discrete log problem (DLP) with the elliptic curve discrete log problem (ECDLP). In short, DLP means: given $y = g^x \bmod p$, it is hard to recover $x$. In comparison, ECDLP means: given $Q = kP$ where $P$ is a point on an elliptic curve over a finite field, it is hard to recover $k$.

In general it is recommended to use ECDH over DH since it has shorter keys, up-to-date standards, and fewer attack vectors. However, if you don't implement ECDH correctly, it is still vulnerable to attacks such as the small-subgroup attack and invalid-curve attack.

The motivation of DH is to exchange a shared key over insecure channel and use that shared key for future symmetric cryptography communication. The same idea applies to ECDH. This type of system is called **"hybrid encryption"**, inheriting the security of public-key cryptography and the speed of symmetric cryptography.

In ECDH, Alice and Bob agree on a point $G$ on some elliptic curve. Each computes a public key from a private scalar: Alice computes $Q_A = d_A \cdot G$ and Bob computes $Q_B = d_B \cdot G$.

The next step is key exchange. They can publish $Q_A$ and $Q_B$ on the Internet (an insecure channel), since an attacker can't efficiently recover $d_A$ or $d_B$ from those public keys.

In the end they compute a shared secret using their private keys. Alice computes $S = d_A \cdot Q_B = d_A(d_B G) = (d_A d_B)G$, and Bob computes $S = d_B \cdot Q_A = d_B(d_A G) = (d_B d_A)G$. These are equal because scalar multiplication is associative and integer multiplication commutes. In practice, $S$ is fed through a KDF to derive a symmetric key.

## Small subgroup attack

Small subgroup attack is a building block of invalid curve attack, so we discuss it first.

First, for a classic small-subgroup attack to work, the curve group must have a non-trivial small-order subgroup. Curves with cofactor $h=1$ avoid this entire class of subgroup pitfalls.

**Note:** secp256k1 has cofactor $h=1$, so the classic *small-subgroup* issue does not apply to it. However, secp256k1 can still be affected by *invalid-curve* style problems if the implementation skips on-curve checks.

Consider an ECDH protocol where Bob does not validate incoming points from Alice sufficiently. Usually a standardized curve will have order of the form $n = q \cdot h$, where $q$ is a large prime and $h$ is some small integer called the **cofactor** (commonly 1, 2, 4, or 8 depending on the curve).

When Alice conducts a small-subgroup attack, she tries to pick a point $Q$ of small order $r$ (typically $r \mid h$). A subtle but important point: it is **not guaranteed** that there exists a point of order exactly $h$ on every curve, even when $h$ divides the group order. (This is precisely why Lagrange's theorem is only a one-way implication.) For the attack, any small-order point is sufficient.

If Bob computes $S = d_B \cdot Q$ and uses it (directly or indirectly) as key material, then because $Q$ has order $r$, the value $d_B \cdot Q$ depends only on $d_B \bmod r$ and has only $r$ possibilities:

$$\langle Q \rangle = \{\mathcal{O}, Q, 2Q, \ldots, (r-1)Q\}.$$

If Alice has an oracle that distinguishes the correct derived key (e.g., decrypt-and-parse behavior, a MAC check, or explicit key confirmation), she can brute-force all $r$ candidates and learn $d_B \bmod r$. Repeating with multiple small primes $r$ leaks more information.

### What “small subgroup” looks like in practice

In practice, small-subgroup issues show up most often in one of these situations:

- **Curves with cofactor $h>1$** (some Edwards/Montgomery curves, some pairing-friendly curves, some custom curves).
- **Protocols that accept raw points** from the peer and perform scalar multiplication without validation.
- **Implementations that conflate “the curve group” with “the prime-order subgroup”**. Many protocols *intend* to operate in a large prime-order subgroup; cofactor points are an “extra” structure that must be handled explicitly.

Even when a curve is standardized and widely used, your implementation details matter: accepting unchecked points or skipping subgroup checks can reintroduce the problem at the application layer.

### Why small-order points exist (and how to find them)

If the curve group has order $n = q \cdot h$ with $h>1$, then for any prime $\ell$ dividing $h$, **Cauchy's theorem applied to the full curve group** implies there exists an element of order $\ell$. That already gives a tiny subgroup to attack.

In practice, one common way to find small-order points is cofactor projection:

- Sample a random point $P$.
- Compute $Q = q \cdot P$ where $q = n/h$.
- Then $Q$ lies in the “cofactor part” of the group and its order divides $h$.
- If $Q = \mathcal{O}$, retry.

Because $h$ is small, you can quickly determine the exact order of $Q$ by checking $Q, 2Q, 4Q, \ldots$ until you hit $\mathcal{O}$.

### Defenses

To prevent small-subgroup attacks:

- Prefer **cofactor-1** curves when possible.
- Always validate that the received point is **on the curve** (see invalid-curve attack below).
- Enforce **subgroup membership** for cofactor $h>1$ curves. If the large prime-order subgroup has order $q$ (prime), then checking $[q]Q = \mathcal{O}$ and $Q \ne \mathcal{O}$ ensures $Q$ is in the correct subgroup.

Practical notes:

- **Don’t confuse cofactor clearing with validation.** Multiplying by $h$ ("cofactor clearing") can be part of some designs, but it does not replace “reject invalid public keys” unless the protocol is specifically designed around it.
- **Beware of “all-zero shared secret” style failures.** Some widely-deployed constructions treat a special shared secret (often the all-zero output) as invalid and abort, because it can be induced by low-order inputs in certain settings. Whether this applies depends on the curve and the key agreement construction, but the meta-lesson is the same: handle edge cases explicitly and consistently.

## Invalid curve attack

If Bob does not verify whether $Q_A$ is actually on the intended elliptic curve (call it the **valid curve**), Alice can send a fake point that lies on some other curve (an **invalid curve**). For example, if the valid curve is secp256k1 (i.e., $y^2 = x^3 + 7$), then Alice can choose curves $y^2 = x^3 + c$ where $c \neq 7$.

Why keep the $x^3$ term fixed and only change the constant term? For short Weierstrass curves $y^2 = x^3 + ax + b$, the affine addition/doubling formulas depend on $a$ but not on $b$. Since secp256k1 has $a = 0$, the same formulas “work” across $y^2 = x^3 + c$ for any $c$, so an implementation that skips the curve-equation check may compute $d_B \cdot Q$ without obvious errors even though $Q$ is off-curve. Check this [answer](https://crypto.stackexchange.com/a/88637/44397) for a derivation.

Invalid-curve attacks are more powerful because the attacker can choose points from many different curves (often twists), obtaining congruences modulo many different small primes.

### What “invalid curve” means operationally

Operationally, “invalid-curve” almost always boils down to: the implementation performs scalar multiplication on an input that was never verified to be a valid group element.

Common root causes:

- **Skipping on-curve checks for performance** (especially in hand-rolled code).
- **Parsing shortcuts** that accept non-canonical or malformed encodings.
- **Using formulas that happen to run** on off-curve inputs (the math doesn’t crash, but the security proof no longer applies).

The fix is straightforward: treat peer public keys as *untrusted input* and validate them before doing key agreement.

Back to the actual attack. Alice chooses a point $Q_1$ on an invalid curve with small prime order $p_1$ and sends it to Bob. Bob computes $S_1 = d_B \cdot Q_1$ and derives a key from it.

If Alice has an oracle that distinguishes the correct key, she can brute-force the $p_1$ possibilities and learn a congruence relation $d_B \equiv r_1 \pmod{p_1}$ for some $r_1$. One round only reveals the private key modulo a small prime.

To recover $d_B$, Alice chooses point $Q_2$ with order $p_2$, point $Q_3$ with order $p_3$, and so on, and repeats the above process. In the end, Alice gets a system of congruences:

$$d_B \equiv r_1 \pmod{p_1}, \quad d_B \equiv r_2 \pmod{p_2}, \quad \ldots, \quad d_B \equiv r_n \pmod{p_n}$$

Since all moduli $p_i$ are prime, they are coprime to each other, satisfying the criteria for the [Chinese Remainder Theorem (CRT)](https://crypto.stanford.edu/pbc/notes/numbertheory/crt.html). Alice can solve for $d_B \bmod (p_1 \cdot p_2 \cdot \ldots \cdot p_n)$. If Alice collects enough congruences so that the product $p_1 \cdot p_2 \cdot \ldots \cdot p_n$ exceeds the range of possible private keys, then $d_B$ is uniquely determined. In other words, Alice recovers Bob's private key completely.

To prevent this attack, Bob must verify that all points sent by Alice satisfy the Weierstrass equation of the valid curve. For curves with cofactor $h > 1$, Bob must also enforce subgroup membership; otherwise, even on-curve points can live in small subgroups.

Practical note: on many short Weierstrass curves used for ECDH (including common NIST-style curves and secp256k1), the cofactor is 1, so subgroup membership is “automatic” once you validate on-curve and reject the identity. On cofactor-$>1$ curves, you need both.

## Practical implementation advice (do this / avoid this)

If this is an *applied cryptography* review, here are the patterns that most often make the difference in real codebases:

Concrete public-key validation checklist:

- **Decode safely**: reject malformed/non-canonical encodings; reject out-of-range coordinates.
- **Reject the identity**: ensure $Q \ne \mathcal{O}$ (or the curve's equivalent “point at infinity” representation).
- **On-curve check**: verify the curve equation holds for $(x,y)$.
- **Subgroup check (when $h>1$)**: ensure $Q$ is in the intended large prime-order subgroup (e.g., $[q]Q = \mathcal{O}$).

Do this:

- **Use a well-reviewed library API that validates keys** (or provides a “check key” function) rather than doing point math on raw bytes.
- **Keep errors uniform** for all key-agreement failures (same error code, similar timing) to avoid accidentally creating a high-quality oracle.
- **Derive keys via a KDF** from the ECDH shared secret (e.g., HKDF) and use an AEAD/MAC with proper key separation.
- **Reject peer keys early** (during parsing/validation) rather than after partially processing them.

Avoid this:

- **Treating “ECDH output bytes” as a symmetric key directly** without a KDF.
- **Hand-rolling parsing** for compressed/uncompressed point formats unless you really need to.
- **Returning different error messages** for “bad encoding” vs “bad curve equation” vs “MAC failed”.

### Encoding gotchas to explicitly test

When reviewing code, these are good test cases to add (or ensure the library already handles):

- Non-canonical encodings (wrong length, forbidden prefixes, extra leading zeros).
- Points with coordinates outside the field range.
- The identity element / point at infinity (if representable in the chosen encoding).
- Off-curve points.
- For cofactor-$>1$ curves: low-order points and points not in the prime-order subgroup.

## Other references not mentioned in article

- [https://safecurves.cr.yp.to/twist.html](https://safecurves.cr.yp.to/twist.html)
- [https://crypto.stackexchange.com/questions/18222/difference-between-ecdh-with-cofactor-key-and-ecdh-without-cofactor-key/26844#26844](https://crypto.stackexchange.com/questions/18222/difference-between-ecdh-with-cofactor-key-and-ecdh-without-cofactor-key/26844#26844)
- [https://www.hackthebox.com/blog/business-ctf-2022-400-curves-write-up](https://www.hackthebox.com/blog/business-ctf-2022-400-curves-write-up)
- [https://crypto.stackexchange.com/questions/43614/how-to-find-the-generator-of-an-elliptic-curve](https://crypto.stackexchange.com/questions/43614/how-to-find-the-generator-of-an-elliptic-curve)
