'use strict';

var mdast,
    assert,
    fixtures,
    chalk,
    diff;

mdast = require('..');
assert = require('assert');
fixtures = require('./fixtures.js');
chalk = require('chalk');
diff = require('diff');

describe('mdast', function () {
    it('should be of type `object`', function () {
        assert(typeof mdast === 'object');
    });
});

describe('mdast.parse()', function () {
    it('should be of type `function`', function () {
        assert(typeof mdast.parse === 'function');
    });
});

describe('mdast.stringify()', function () {
    it('should be of type `function`', function () {
        assert(typeof mdast.stringify === 'function');
    });
});

var validateToken,
    validateTokens;

validateTokens = function (children) {
    children.forEach(validateToken);
};

validateToken = function (context) {
    var keys = Object.keys(context),
        type = context.type,
        key;

    assert('type' in context);

    if ('children' in context) {
        assert(Array.isArray(context.children));
        validateTokens(context.children);
    }

    if ('value' in context) {
        assert(typeof context.value === 'string');
    }

    if (type === 'root') {
        assert('children' in context);

        if (context.footnotes) {
            for (key in context.footnotes) {
                validateTokens(context.footnotes[key]);
            }
        }

        return;
    }

    if (
        type === 'paragraph' ||
        type === 'blockquote' ||
        type === 'tableHeader' ||
        type === 'tableRow' ||
        type === 'tableCell' ||
        type === 'strong' ||
        type === 'emphasis' ||
        type === 'delete'
    ) {
        assert(keys.length === 2);
        assert('children' in context);

        return;
    }

    if (type === 'listItem') {
        assert(keys.length === 3);
        assert('children' in context);
        assert('loose' in context);

        return;
    }

    if (type === 'footnote') {
        assert(keys.length === 2);
        assert('id' in context);

        return;
    }

    if (type === 'heading') {
        assert(keys.length === 3);
        assert(context.depth > 0);
        assert(context.depth <= 6);
        assert('children' in context);

        return;
    }

    if (type === 'inlineCode') {
        assert(keys.length === 2);
        assert('value' in context);

        return;
    }

    if (type === 'code') {
        assert(keys.length === 3);
        assert('value' in context);

        assert(
            context.lang === null ||
            typeof context.lang === 'string'
        );

        return;
    }

    if (type === 'horizontalRule' || type === 'break') {
        assert(keys.length === 1);

        return;
    }

    if (type === 'list') {
        assert('children' in context);
        assert(typeof context.ordered === 'boolean');
        assert(keys.length === 3);

        return;
    }

    if (type === 'text') {
        assert(keys.length === 2);
        assert('value' in context);

        return;
    }

    if (type === 'link') {
        assert('children' in context);
        assert(
            context.title === null ||
            typeof context.title === 'string'
        );
        assert(typeof context.href === 'string');
        assert(keys.length === 4);

        return;
    }

    if (type === 'image') {
        assert(
            context.title === null ||
            typeof context.title === 'string'
        );
        assert(
            context.alt === null ||
            typeof context.alt === 'string'
        );
        assert(typeof context.src === 'string');
        assert(keys.length === 4);

        return;
    }

    if (type === 'table') {
        assert(keys.length === 3);
        assert('children' in context);

        assert(Array.isArray(context.align));

        context.align.forEach(function (align) {
            assert(
                align === null ||
                align === 'left' ||
                align === 'right' ||
                align === 'center'
            );
        });

        return;
    }

    /* This is the last possible type. If more types are added, they
     * should be added before this block, or the type:html tests should
     * be wrapped in an if statement. */
    assert(type === 'html');
    assert(keys.length === 2);
    assert('value' in context);
};

var stringify;

stringify = JSON.stringify;

describe('fixtures', function () {
    fixtures.forEach(function (fixture) {
        var baseline = JSON.parse(fixture.tree),
            node;

        it('should parse `' + fixture.name + '` correctly', function () {
            node = mdast.parse(fixture.input, fixture.options);

            validateToken(node);

            try {
                assert(stringify(node) === stringify(baseline));
            } catch (error) {
                /* istanbul ignore next */
                logDifference(
                    stringify(baseline, 0, 2), stringify(node, 0, 2)
                );

                /* istanbul ignore next */
                throw error;
            }
        });

        it('should stringify `' + fixture.name + '` correctly', function () {
            var generatedMarkdown,
                generatedNode;

            generatedMarkdown = mdast.stringify(node);
            generatedNode = mdast.parse(generatedMarkdown, fixture.options);

            try {
                assert(stringify(node) === stringify(generatedNode));
            } catch (error) {
                /* istanbul ignore next */
                logDifference(
                    stringify(node, 0, 2), stringify(generatedNode, 0, 2)
                );

                /* istanbul ignore next */
                throw error;
            }
        });
    });
});

/* istanbul ignore next */
function logDifference(value, alternative) {
    var difference;

    difference = diff.diffLines(value, alternative);

    if (!difference || !difference.length) {
        return;
    }

    difference.forEach(function (change) {
        var colour;

        colour = change.added ? 'green' : change.removed ? 'red' : 'dim';

        process.stdout.write(chalk[colour](change.value));
    });
}