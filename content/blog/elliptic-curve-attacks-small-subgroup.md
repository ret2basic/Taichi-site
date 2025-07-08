---
title: "Elliptic curve attacks - from small subgroup attack to invalid curve attack"
slug: "elliptic-curve-attacks-small-subgroup"
excerpt: "Discussion of two attack methods when the code does not check if an EC point is actually on the curve."
author: "ret2basic.eth"
date: "2024-04-12"
readTime: "30 min read"
category: "Cryptography"
tags: ["Elliptic Curves", "Cryptography"]
featured: true
image: "/images/blog/elliptic-curve-attacks.png"
---

# TL;DR

When auditing elliptic curve libs, especially **ECDH** related code, double check if the code has sufficient validation on the points sent by the users. If not, attacker can send bogus points to trick the backend server, recovering server's private key in the worst case. 

There is a well-known attack called **"small subgroup attack"**, where the attacker can pick a point from a subgroup with small order and send to the server. Since order (number of elements in the group) is small, it is easy to bruteforce the shared secret and thus decrypt any encryption in the communication. This attack also reveals server's private key modulo the order of the point you chose. To prevent this attack, the server should verify if the point is chosen from a known subgroup, or simply pick a curve with prime order (so that there is no nontrivial subgroup).

Another lesser-known attack is called **"invalid curve attack"**, the idea is built on top of small subgroup attack. In this attack, attacker picks points with small order from many "similar" curves (differs only in constant term) and sends them to the server. For each point, attacker learns a congruence of server's private key. In the end, attacker collects a system of congruences and solve the private key using Chinese Remainder Theorem. To prevent such attack, the code should verify that the incoming point satisfies curve equation.

I am writing this article since I found most existing articles don't explain the details (especially math details) very well. When reading those resources, I had been confused multiple times due to lack of explanation. Therefore I will try my best to make sense all the steps in these two related attacks.

Feel free to DM me on [Twitter](https://twitter.com/ret2basic) if you find any mistake in this article.

# Prerequisite readings

You need to understand basic abstract algebra and how elliptic curve works, but shallow understanding is enough. I recommend the following articles:

- [https://www.rareskills.io/post/set-theory](https://www.rareskills.io/post/set-theory)
- [https://www.rareskills.io/post/group-theory-and-coding](https://www.rareskills.io/post/group-theory-and-coding)
- [https://www.rareskills.io/post/rings-and-fields](https://www.rareskills.io/post/rings-and-fields)
- [https://www.rareskills.io/post/elliptic-curve-addition](https://www.rareskills.io/post/elliptic-curve-addition)
- [https://www.rareskills.io/post/elliptic-curves-finite-fields](https://www.rareskills.io/post/elliptic-curves-finite-fields)
- [https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/](https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/)
- [https://andrea.corbellini.name/2015/05/23/elliptic-curve-cryptography-finite-fields-and-discrete-logarithms/](https://andrea.corbellini.name/2015/05/23/elliptic-curve-cryptography-finite-fields-and-discrete-logarithms/)

# Some (sub)group theory: Lagrange's theorem and Cauchy's theorem

We will need some group theory results to understand why small subgroup attack and invalid curve attack work. This part is missing from most of the articles / ctf writeups on the Internet, so pay attention. We are going to cover two theorems regarding subgroups: Lagrange's theorem and Cauchy's theorem.

**Lagrange's theorem:**

![Lagrange's theorem](/images/blog/Lagrange's%20Theorem.png)

**Reference:** [http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html](http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html)

Here is short intro to cosets and Lagrange's theorem on [Youtube](https://youtu.be/TCcSZEL_3CQ?si=Gkd_nBL83jnqfqhA). Basically this theorem says if $$H$$ is a subgroup of $$G$$ then the order of $$H$$ divides the order of $$G$$. For example, say $$G$$ is a group of order 12, then the only **possible subgroups** are subgroups of order 2, 3, 4, and 6, not counting the trivial subgroups $$\{e\}$$ and $$G$$ itself. Note that it does not mean there are only four non-trivial subgroups: multiple subgroups with the same order can exist.

The idea for proving Lagrange's theorem is that cosets partition a group $$$$G$$$$ and all cosets have the same size. Moreover, each coset $$gH$$ has the same size as the subgroup $$H$$. Visually, you can think of the group $$G$$ is a chocolate bar and each coset is a chuck of it. You can prove that all cosets are pairwise disjoint, which means they don't overlap. It is easy to see that the order of the group is just the sum of the order of all cosets, so the order of each coset divides the order of the group, therefore the order of each subgroup divides the order of the group (since order of $$gH$$ is the same as the order of $$H$$). Not a formal proof, but you get the idea.

Lagrange's theorem has two important corollaries:

![Lagrange's Theorem corollaries](/images/blog/Lagrange's%20Theorem%20corollary.png)

**Reference:** [http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html](http://abstract.ups.edu/aata/cosets-section-lagranges-theorem.html)

The first corollary is very easy to understand. The second corollary is saying "any group with prime order $$p$$ is a cyclic group and any element other than identity is a generator". Recall that elliptic curve over finite field is a group, therefore these two corollaries apply to it. In elliptic curves, the first corollary says the order of a point on elliptic curve always divides the order of the curve. The second corollary says for any curve with prime order, the curve is cyclic and all points besides point at infinity are generators.

**These two corollaries are important results, keep that in mind, we will use them a lot when studying elliptic curves.**

And ATTENTION, you should know that Lagrange's theorem is an **if-then theorem**: if $$H$$ is a subgroup of $$G$$, then the order of $$H$$ divides the order of $$G$$. It does not guarantee the existence of a subgroup of a certain order. Equivalently, this reasoning is saying "the reverse of Lagrange's theorem is false": if the order of $$H$$ divides the order of $$G$$, $$H$$ might not be a subgroup of $$G$$. Fortunately, the reverse of Lagrange's theorem is sometimes true, when $$H$$ has prime order.

**Cauchy's theorem:**

![Cauchy's Theorem](/images/blog/Cauchy's%20Theorem.png)

**Reference:** [http://abstract.ups.edu/aata/sylow-section-sylow-theorems.html](http://abstract.ups.edu/aata/sylow-section-sylow-theorems.html)

For example, say group $$G$$ has order 6. We can factor 6 into prime decomposition: 6 = 2 * 3. Cauchy's theorem guarantees that subgroups with order 2 and 3 exist. In summary, Lagrange's theorem tells you what are the possible subgroup orders, and Cauchy's theorem tells you subgroups of prime orders (prime factors of $$G$$) actually exists.

Recall the second corollary of Lagrange's theorem says any group of prime order is cyclic, and any element other than identity is a generator. Combining it with Cauchy's theorem, the prime order subgroups we get are all cyclic, and any (non-trivial) element in the subgroup is a generator. Recall that first corollary of Lagrange's theorem says the order of an element in a group divides the order of the group. Since we are working with prime order subgroups, it is easy to see that the order of element is either 1 or $$p$$, where $$p$$ is the order of the prime order subgroup. The order 1 case corresponds to the identity element, so we can conclude that if prime order subgroup has order $$p$$, then any non-trivial element in it has order $$p$$ as well.

You might ask, why bother studying subgroups though? Abstractly, think of taking subgroup as reducing a big problem to a small one. In the two attacks we are going to talk about next, you will see how taking subgroups converts a hard problem into easy problem (computationally).

# Understanding Elliptic Curve Diffie-Hellman (ECDH)

ECDH is like traditional Diffie-Hellman (DH), but replaces the original discrete log problem (DLP) with elliptic curve discrete log problem (ECDLP). In short, DLP means given $$y = g^x \mod p$$, it is hard (hard means nearly impossible) to recover $$x$$. In comparison, ECDLP means given $$Q = nP$$ where $$P$$ is some point on an elliptic curve over a finite field, it is hard to recover $$n$$.

In general it is recommended to use ECDH over DH since it has shorter key, up-to-date standard and less attack vectors. However, if you don't implement ECDH correctly, it is still vulnerable to attacks such as small group attack and invalid curve attack.

The motivation of DH is to exchange a shared key over insecure channel and use that shared key for future symmetric cryptography communication. The same idea applies to ECDH. This type of system is called **"hybrid encryption"**, inheriting the security of public-key cryptography and the speed of symmetric cryptography.

In ECDH, Alice and Bob agree on a point $$G$$ on some elliptic curve, each of them compute public key based on private key. This step is just elliptic curve multiplication: Alice computes public key $$Q_A = d_A * G$$ and Bob computes public key $$Q_B = d_B * G$$, where $$d_A$$ is Alice's private key and $$d_B$$ is Bob's private key.

The next step is key exchange. They can just publish $$Q_A$$ and $$Q_B$$ on the Internet (insecure channel), since attacker can't crack for $$d_A$$ and $$d_B$$. The hardness is guaranteed by ECDLP.

In the end they compute a shared secret (this is the shared key) using their private keys. Alice computes $$key = d_A * Q_B = d_A * (d_B * G) = d_A * d_B * G$$, and Bob computes $$key = d_B * Q_A = d_B * (d_A * G) = d_B * d_A * G$$. Since elliptic curve multiplication is commutative, both Alice and Bob arrive at the same shared secret $$d_A * d_B * G$$. After that, they can use this shared key for symmetric encryption.

# Small subgroup attack

Small subgroup attack is a building block of invalid curve attack, so we discuss it first.

First, for small subgroup attack to work, **the curve must have composite order**. This is easy to understand since we just talked about Cauchy's theorem: if the elliptic curve has prime order, then the only subgroup with prime order is itself. There is no concept of "small subgroup" for curve with prime order $$p$$ since the factors of a prime $$p$$ is just 1 and $$p$$. In other words, curves with prime order don't have small subgroups thus immune from small subgroup attack.

Consider a ECDH protocol where Bob does not validate incoming points from Alice sufficiently. Usually a standardized curve will have order of the form $$n = q \cdot h$$, where $$n$$ is the order of the curve, $$q$$ is a large prime which is also the order of a predefined point $$P$$ on curve, and $$h$$ is some small integer called the **cofactor**. In reality this cofactor is 1, 4, or 8, so fairly small.

When Alice conducts small subgroup attack, she can pick a point $$Q$$ with order $$h$$ instead of $$q$$. You might ask, how do you know point of order $$h$$ exist? (This is called **h-torsion** point, where torsion point means point with finite order on an elliptic curve. h-torsion means the order is $$h$$, that is, $$hP = O$$ where $$O$$ is point at infinity.) Recall that elliptic curve itself is a group structure, therefore Lagrange's theorem works for elliptic curve points. By Lagrange's theorem corollary 1, the order of an elliptic curve point divides order of the curve. Since order of curve is $$n = qh$$, points can have orders that are divisors of $$n$$. For the small subgroup attack, we are specifically interested in points whose orders divide the cofactor $$h$$. We have discussed that if $$h = 1$$ then the curve is immune to small subgroup attack. Excluding that, we would consider:

- $$h = 4 = 2^2$$ -> point can have order 1, 2, or 4
- $$h = 8 = 2^3$$ -> point can have order 1, 2, 4, or 8

Without getting stuck into details, let's say Alice can find a point $$Q$$ with order $$h$$. She sends $$Q$$ to Bob, Bob computes $$d_B * Q$$ and use that as shared key to encrypt further communication. Since $$Q$$ has small order $$h$$, there are only $$h$$ possibilities for $$d_B \cdot Q$$. Why? The point $$Q$$ generates a cyclic subgroup $$\langle Q \rangle = \{O, Q, 2Q, 3Q, \ldots, (h-1)Q\}$$ of order $$h$$. Therefore $$d_B \cdot Q$$ must be one of these $$h$$ values, regardless of what $$d_B$$ is. Alice can compute all $$h$$ possibilities and test each as a decryption key to see which produces meaningful plaintext. **This reduces the discrete logarithm problem from the full curve (order $$\approx 2^{256}$$) to a tiny subgroup (order $$h \leq 8$$)**. This will take 4 or 8 tries depending on the value of $$h$$.

~~(**TODO:** I still don't know how to prove a point with a certain order actually exist on a curve and I don't have an algorithm for finding it. Will come back later if I figure out).~~

(**UPDATE:** I figured out how to prove point existence and find them. 

**Proof of existence - step by step logic**:

**Step 1 - What we want to prove**: We need to show that points with order exactly $$h$$ (or orders dividing $$h$$) actually exist on our curve.

**Step 2 - Setup**: Assume our curve has composite order $$n = q \cdot h$$ where $$q$$ is a large prime and $$h$$ is the small cofactor (like 4 or 8).

**Step 3 - Lagrange's theorem tells us what's possible**: By Lagrange's theorem, any point $$P$$ on the curve must have order dividing $$n = q \cdot h$$. So possible orders are: $$\{1, 2, 4, q, 2q, 4q, h, qh\}$$ (assuming $$h = 4$$ for example). This includes orders that divide $$h$$, but doesn't guarantee they exist.

**Step 4 - The h-torsion subgroup**: Consider the set of all points $$P$$ such that $$h \cdot P = O$$. This is called the **$$h$$-torsion subgroup**, denoted $$E[h]$$. Any point in this subgroup has order dividing $$h$$.

**Step 5 - Why the h-torsion subgroup is non-trivial**: Here's the key insight: since our curve has order $$n = q \cdot h$$, we know that for ANY point $$P$$ on the curve, we have $$n \cdot P = (q \cdot h) \cdot P = O$$. This can be rewritten as $$h \cdot (q \cdot P) = O$$. This means $$q \cdot P$$ is always in the $$h$$-torsion subgroup $$E[h]$$!

**Step 6 - Cauchy's theorem guarantees specific orders**: Since $$h$$ has prime factors (say $$h = 2^k$$), Cauchy's theorem guarantees that $$E[h]$$ contains elements of each prime order dividing $$h$$. For $$h = 8 = 2^3$$, we're guaranteed points of order 2.

**Step 7 - Structure gives us more**: The $$h$$-torsion subgroup $$E[h]$$ actually has a rich structure. For most curves, $$|E[h]| = h^2$$ when $$\gcd(h, \text{char}(k)) = 1$$, giving us many points of various orders dividing $$h$$.

**Algorithm**: Take any random point $$P$$ on the curve and compute $$Q = q \cdot P$$ where $$q = n/h$$. By Step 5 above, $$Q$$ is guaranteed to be in $$E[h]$$, so its order divides $$h$$. Check the actual order by computing $$Q, 2Q, 3Q, \ldots$$ until reaching point at infinity. Since $$h$$ is small (≤8), this is fast.

**Why this works**: The cofactor multiplication $$Q = q \cdot P$$ is essentially "projecting" any curve point into the small $$h$$-torsion subgroup, giving us our attack point!).

To prevent small subgroup attack, your code should reject any incoming point $$Q$$ such that $$h \cdot Q = O$$ from Alice. Another way to prevent this attack is to use curves with $$h = 1$$ (prime order curves), so that no small subgroups exist.

# Invalid curve attack

If Bob does not verify if $$Q_A$$ is actually on the elliptic curve (call it **valid curve**), Alice can come up with some fake point which lies on some other elliptic curve (call it **invalid curve**). For example, if the valid curve is secp256k1 $$\rightarrow y^2 = x^3 + 7$$, then Alice can choose invalid curves $$y^2 = x^3 + c$$, where $$c \neq 7$$. You might ask, why keep the $$x^3$$ term fixed and only change the constant term? It is because **elliptic curve addition formulas for short Weierstrass curves $$y^2 = x^3 + ax + b$$ only depend on the $$a$$ coefficient, not the $$b$$ term**. Since most standardized curves have $$a = 0$$, the addition law works identically across curves $$y^2 = x^3 + c$$ for any constant $$c$$. This allows Bob's software to compute $$d_B \cdot Q$$ without errors, even though $$Q$$ is from a different curve. Check this [answer](https://crypto.stackexchange.com/a/88637/44397) for full derivation.

Invalid curve attack is superior compared with small subgroup attack since we have more degrees of freedom. We can pick a point with order $$p_1$$ from a curve, pick point with order $$p_2$$ from another curve, then point with order $$p_3$$ from another curve, and continue. Recall that in small subgroup attack we could just pick point from a subgroup of the same curve, so choices were a lot more limited.

Back to the actual attack. Alice then chooses a point $$Q_1$$ on the invalid curve with small prime order $$p_1$$. Alice sends $$Q_1$$ to Bob in the key exchange phase. Bob would compute key = $$d_B \cdot Q_1$$, where $$d_B$$ is Bob's private key. In the end Bob will encrypt message using this computed key and send ciphertext to Alice.

Once Alice receives ciphertext, she can bruteforce the shared key. Since $$p_1$$ is fairly small, the shared key $$d_B \cdot Q_1$$ only has $$p_1$$ possible values. Alice can traverse all possible points on the invalid curve and see which point decrypts the encrypted message correctly (for example it should return some meaningful string). In this round, Alice learns a congruence relation $$d_B \equiv r_1 \pmod{p_1}$$ for some $$r_1$$. It is not possible to learn $$d_B$$ in only one round since the attack only reveals the private key modulo the order of the chosen point.

To recover $$d_B$$, Alice chooses point $$Q_2$$ with order $$p_2$$, point $$Q_3$$ with order $$p_3$$, and so on, and repeats the above process. In the end, Alice gets a system of congruences:

$$d_B \equiv r_1 \pmod{p_1}, \quad d_B \equiv r_2 \pmod{p_2}, \quad \ldots, \quad d_B \equiv r_n \pmod{p_n}$$

Since all moduli $$p_i$$ are prime, they are coprime to each other, satisfying the criteria for [Chinese Remainder Theorem (CRT)](https://crypto.stanford.edu/pbc/notes/numbertheory/crt.html). Alice can solve for $$d_B \bmod (p_1 \cdot p_2 \cdot \ldots \cdot p_n)$$. If Alice collects enough congruences so that the product $$p_1 \cdot p_2 \cdot \ldots \cdot p_n$$ exceeds the range of possible private keys, then $$d_B$$ is uniquely determined. In other words, Alice recovers Bob's private key completely.

To prevent this attack, Bob should verify all points sent by Alice satisfy the Weierstrass equation of the valid curve.

# Other references not mentioned in article

- [https://safecurves.cr.yp.to/twist.html](https://safecurves.cr.yp.to/twist.html)
- [https://crypto.stackexchange.com/questions/18222/difference-between-ecdh-with-cofactor-key-and-ecdh-without-cofactor-key/26844#26844](https://crypto.stackexchange.com/questions/18222/difference-between-ecdh-with-cofactor-key-and-ecdh-without-cofactor-key/26844#26844)
- [https://www.hackthebox.com/blog/business-ctf-2022-400-curves-write-up](https://www.hackthebox.com/blog/business-ctf-2022-400-curves-write-up)
- [https://crypto.stackexchange.com/questions/43614/how-to-find-the-generator-of-an-elliptic-curve](https://crypto.stackexchange.com/questions/43614/how-to-find-the-generator-of-an-elliptic-curve)
