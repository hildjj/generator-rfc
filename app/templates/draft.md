---
title: <%= props.description %>
abbrev: I-D
docname: <%= name %>
date: <%= date %>
category: std
ipr: trust200902
<% if (props.keywords) { %>keywords:
<% for (var i=0; i<props.keywords.length; i++) {%> - <%= props.keywords[i] %>
<% }} %>
author:
 -
    ins: <%= props.authorIns %>
    name: <%= props.authorName %>
    organization: <%= props.authorOrg %>
    email: <%= props.authorEmail %>

normative:
  RFC2119:

informative:
  RFC3552:
  RFC5226:

--- abstract

A short description of the work.

--- middle

# Introduction

Introduce your document here.

## Terminology

In this document, the key words "MUST", "MUST NOT", "REQUIRED",
"SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY",
and "OPTIONAL" are to be interpreted as described in BCP 14, {{RFC2119}}.

# Security Considerations

See {{RFC3552}} for ideas.

# IANA Considerations

See {{RFC5226}} for ideas.

--- back
