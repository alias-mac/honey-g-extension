var SugarCRM = (function(SugarCRM, $) {

    /**
     * Allows the highlighting of the merged branches on honey-g page.
     *
     * This is an helper class to use for internal systems at SugarCRM.
     */
    var Merged = SugarCRM.Merged = function(options) {
        this.initialize.apply(this, arguments);
    };

    $.extend(true, Merged.prototype, {

        defaults: {
            repoCol: 5,
            branchCol: 0,
            baseBranch: 'master',
            styleMapping: {
                'closed': 'error',
                'merged': 'info'
            }
        },

        /**
         * Initializes SugarCRM merged plug-in.
         *
         * @param {Object} options (optional) options to override the default
         *   ones.
         */
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
        },

        /**
         * Highlights all matches of merged repositories.
         *
         * The token to get the information from Github is provided by the
         * options page (saved on storage).
         *
         * @return {Object} this instance for chaining.
         */
        highlight: function() {
            var self = this;
            chrome.storage.sync.get('github_access_token', function(response) {
                self.token = response['github_access_token'];
                self._listen();
                self._parseAll();
            });
            return this;
        },


        /**
         * Listen to honey-g table changes.
         *
         * Honey-g changes the information of the builds using ajax requests.
         *
         * @private
         */
        _listen: function() {
            $('#buildList-tbody').on('DOMSubtreeModified', $.proxy(this._parseAll, this));
        },

        /**
         * Parses all the builds information provided on the buildList table.
         *
         * @see _parse()
         * @private
         */
        _parseAll: function() {

            var self = this;
            $('#buildList-tbody tr').each(function(row, build) {
                self._parse(build);
            });
        },

        /**
         *
         * @param {HTMLElement} build element to get the information from
         *   github.
         * @private
         */
        _parse: function(build) {
            var self = this,
                $build = $(build), $actions = $build.find('td:last'),
                repo, branch, user;

            if ($build.data('merged-parsed')) {
                return;
            }

            $build.data('merged-parsed', true);

            repo = $build.find('td:nth(' + this.settings.repoCol + ')').text();
            branch = $build.find('td:nth(' + this.settings.branchCol + ')').text();
            user = repo.replace(/(.*):(.*)\/(.*)/, '$2');

            this._githubBranchInfo(user, branch, this.settings.baseBranch)
                .done(function(data) {

                    if (!data || !data.length) {
                        // nothing to do on this row
                        return;
                    }

                    var merged = false, closed = false;
                    $.each(data, function(i, pr) {
                        $actions.append('<a href="' + pr.html_url + '" target="_blank">' + pr.number + '</a>');
                        if (pr.merged_at) {
                            merged = true;
                        }
                        if (pr.closed_at) {
                            closed = true;
                        }
                    });

                    // give priority to merge state (if any of the PRs have that state)
                    // TODO change this to check for latest PR date
                    if (closed || merged) {
                        var style = closed ? 'closed' : '';
                        style = merged ? 'merged' : style;
                        $build.addClass(self.settings.styleMapping[style]);
                    }

                });
        },

        /**
         * Get github PR information based on provided arguments.
         *
         * @param {String} user the github user/organization account.
         * @param {String} branch the branch to track PR from.
         * @param {String} base the branch against the forked repo to check for
         *   PRs.
         * @return {Object} the jqXHR object from jQuery.
         * @private
         */
        _githubBranchInfo: function(user, branch, base) {

            return $.ajax({
                type: 'GET',
                url: 'https://api.github.com/repos/sugarcrm/Mango/pulls',
                data: {
                    access_token: this.token,
                    state: 'closed', // search for closed only
                    base: base,
                    head: user + ':' + branch
                }
            });

        }

    });

    return SugarCRM;

})(SugarCRM || {}, jQuery);
