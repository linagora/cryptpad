[![An XWiki Labs Project](https://raw.githubusercontent.com/xwiki-labs/xwiki-labs-logo/master/projects/xwikilabs/xlabs-project.png "XWiki labs")](https://labs.xwiki.com/xwiki/bin/view/Main/WebHome)

![CryptPad screenshot](https://github.com/xwiki-labs/cryptpad/raw/master/screenshot.png "Pads are an easy way to collaborate")

CryptPad is the **Zero Knowledge** realtime collaborative editor.

Encryption carried out in your web browser protects the data from the server, the cloud
and the NSA. It relies on the [ChainPad] realtime engine.

<!--If you'd like to know more, please read [the Whitepaper]().-->

# Installation

Installing CryptPad is pretty straightforward. You can read all about it in the
[installation guide](https://github.com/xwiki-labs/cryptpad/wiki/Installation-guide).

It also contains information on keeping your instance of CryptPad up to date.

## Current version

The most recent version and all past release notes can be found [here](https://github.com/xwiki-labs/cryptpad/releases/).

## Setup using Docker

See [Cryptpad-Docker](docs/cryptpad-docker.md) and the community wiki's [Docker](https://github.com/xwiki-labs/cryptpad/wiki/Docker-(with-Nginx-and-Traefik)) page for details on how to get up-and-running with Cryptpad in Docker.

## Setup using Ansible

See [Ansible Role for Cryptpad](https://github.com/systemli/ansible-role-cryptpad).

# Security

CryptPad is *private*, not *anonymous*. Privacy protects your data, anonymity protects you.
As such, it is possible for a collaborator on the pad to include some silly/ugly/nasty things
in a CryptPad such as an image which reveals your IP address when your browser automatically
loads it or a script which plays Rick Astleys's greatest hits. It is possible for anyone
who does not have the key to be able to change anything in the pad or add anything, even the
server, however the clients will notice this because the content hashes in ChainPad will fail to
validate.

The server does have a certain power, it can send you evil javascript which does the wrong
thing (leaks the key or the data back to the server or to someone else). This is however an
[active attack] which makes it detectable. The NSA really hates doing these because they might
get caught and laughed at and humiliated in front of the whole world (again). If you're making
the NSA mad enough for them to use an active attack against you, Great Success Highfive, now take
the battery out of your computer before it spawns Agent Smith.

Still there are other low-lives in the world so using CryptPad over HTTPS is probably a good idea.

# Translations

We'd like to make it easy for more people to use encryption in their routine activities.
As such, we've tried to make language-specific parts of CryptPad translatable. If you're
able to translate CryptPad's interface, and would like to help, please contact us!

You can also see [our translation guide](/customize.dist/translations/README.md).

# Contacting Us

You can reach members of the CryptPad development team on [Twitter](https://twitter.com/cryptpad),
via our [GitHub issue tracker](https://github.com/xwiki-labs/cryptpad/issues/), on our
[Matrix channel](https://riot.im/app/#/room/#cryptpad:matrix.org), or by
[e-mail](mailto:research@xwiki.com).

# Contributing

We love Open Source and we love contribution. It is our intent to keep this project available
under the AGPL license forever but in order to finance more development on this and other FOSS
projects, we also wish to sell other licenses to this software. Before making a pull request,
please read and
[sign the Commons Management Agreement](https://www.clahub.com/agreements/cjdelisle/cryptpad).

If you have any questions or comments, or if you're interested in contributing to Cryptpad, come say hi on IRC, `#cryptpad` on Freenode.

# License

![AGPL logo](https://www.gnu.org/graphics/agplv3-155x51.png "GNU Affero General Public License")

This software is and will always be available under the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the License, or (at your option)
any later version. If you wish to use this technology in a proprietary product, please contact
sales@xwiki.com.

[ChainPad]: https://github.com/xwiki-contrib/chainpad
[active attack]: https://en.wikipedia.org/wiki/Attack_(computing)#Types_of_attacks
