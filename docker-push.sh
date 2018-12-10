#!/bin/bash
set -ev
docker login -u $DOCKER_USER --password-stdin <<< $DOCKER_PASS
echo "Branch is ${TRAVIS_BRANCH}"
if [[ "$TRAVIS_BRANCH" = "master" ]] ; then
	echo "Pushing :latest docker tag for master build"
	docker push jamiemjennings/github-issue-printer
else
	docker push jamiemjennings/github-issue-printer:${BUILD_VERSION}
fi
